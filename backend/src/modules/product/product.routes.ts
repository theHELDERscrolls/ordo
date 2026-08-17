import express from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createProductSchema, stockStatusSchema, updateProductSchema } from '@ordo/shared';
import { Product } from './product.model.js';
import { stockStatusExpr } from './product.status.js';
import { requireAuth, loadUser, requireAdmin } from '../auth/auth.middleware.js';
import { getAccessibleBusinessIds } from '../user/user.access.js';

/** A Mongo query, assembled incrementally with operators such as `$expr` and `$or`. */
type Query = Record<string, unknown>;

/** Inventory CRUD. Reads are open to any member; writes require `admin`. */
export const productRouter = express.Router();

productRouter.use(requireAuth, loadUser);

/** Neutralises regex metacharacters, so a search term cannot inject a pattern. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Narrows the list to a stock bucket. An unknown value filters nothing. */
function stockStatusFilter(status: string | undefined): Query {
  const parsed = stockStatusSchema.safeParse(status);
  return parsed.success ? { $expr: stockStatusExpr[parsed.data] } : {};
}

// An allowlist, so a query parameter can never reach the sort as an arbitrary field.
const SORT_FIELDS: Record<string, string> = {
  name: 'name',
  stock: 'stock',
  salePrice: 'salePrice',
  createdAt: 'createdAt',
};

function qStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

/**
 * Scopes a single-product lookup to the businesses the caller may touch, so one
 * tenant can never read or mutate another's product by guessing its id.
 *
 * @returns `null` when the id is malformed, which callers treat as a 404.
 */
function scopedFilter(req: Request): Query | null {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  return { _id: req.params.id, businessId: { $in: getAccessibleBusinessIds(req.user!) } };
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

/** `GET /products` — the tenant's catalogue, filtered, sorted and paginated. */
productRouter.get('/', async (req: Request, res: Response) => {
  const filter: Query = {
    businessId: { $in: getAccessibleBusinessIds(req.user!) },
    ...stockStatusFilter(qStr(req.query.stockStatus)),
  };
  const category = qStr(req.query.category);
  const supplier = qStr(req.query.supplier);
  const search = qStr(req.query.search);
  if (category) filter.category = category;
  if (supplier) filter.supplier = supplier;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { sku: rx }];
  }

  const sortField = SORT_FIELDS[qStr(req.query.sort) ?? 'name'] ?? 'name';
  const sortDir = req.query.order === 'desc' ? -1 : 1;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ items: items.map((p) => p.toJSON()), total, page, limit });
});

/**
 * `GET /products/facets` — the distinct categories and suppliers, so the filters
 * fill independently of the current page. Declared before `/:id` so that "facets"
 * is not matched as an id.
 */
productRouter.get('/facets', async (req: Request, res: Response) => {
  const scope: Query = { businessId: { $in: getAccessibleBusinessIds(req.user!) } };
  const [categories, suppliers] = await Promise.all([
    Product.distinct('category', scope),
    Product.distinct('supplier', scope),
  ]);
  const clean = (values: unknown[]): string[] =>
    (values.filter((v) => typeof v === 'string' && v.length > 0) as string[]).sort();
  res.json({ categories: clean(categories), suppliers: clean(suppliers) });
});

/**
 * `POST /products` — create. `businessId` comes from the session and never the
 * body, so a client cannot plant a product in another tenant.
 */
productRouter.post('/', requireAdmin, async (req: Request, res: Response) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid product', details: parsed.error.flatten() });
    return;
  }
  try {
    const product = await Product.create({ ...parsed.data, businessId: req.user!.businessId });
    res.status(201).json(product.toJSON());
  } catch (err) {
    if (isDuplicateKey(err)) {
      res.status(409).json({ error: 'A product with this SKU already exists' });
      return;
    }
    throw err;
  }
});

/** `GET /products/:id` — one product from the caller's own catalogue. */
productRouter.get('/:id', async (req: Request, res: Response) => {
  const filter = scopedFilter(req);
  const product = filter && (await Product.findOne(filter));
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(product.toJSON());
});

/** `PATCH /products/:id` — update any subset of the editable fields. */
productRouter.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid product', details: parsed.error.flatten() });
    return;
  }
  const filter = scopedFilter(req);
  try {
    const product =
      filter &&
      (await Product.findOneAndUpdate(filter, parsed.data, {
        returnDocument: 'after',
        runValidators: true,
      }));
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product.toJSON());
  } catch (err) {
    if (isDuplicateKey(err)) {
      res.status(409).json({ error: 'A product with this SKU already exists' });
      return;
    }
    throw err;
  }
});

/** `DELETE /products/:id` — remove a product from the catalogue. */
productRouter.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const filter = scopedFilter(req);
  const product = filter && (await Product.findOneAndDelete(filter));
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.status(204).send();
});
