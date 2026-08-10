import express from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createProductSchema, updateProductSchema } from '@ordo/shared';

// Mongo query object. Kept as a plain record because we assemble it incrementally
// with operators ($expr, $or); Mongoose accepts it on find/findOne/etc.
type Query = Record<string, unknown>;
import { Product } from './product.model.js';
import { requireAuth, loadUser, requireAdmin } from '../auth/auth.middleware.js';
import { getAccessibleBusinessIds } from '../user/user.access.js';

export const productRouter = express.Router();

// Every product route needs the authenticated user (for business scoping and role).
productRouter.use(requireAuth, loadUser);

// Escape user input before using it in a RegExp, so a search term cannot inject
// regex metacharacters.
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Mongo filter for a stock-status bucket. `low`/`in` compare two fields, so they
// need $expr; `out` is a plain equality.
function stockStatusFilter(status: string | undefined): Record<string, unknown> {
  if (status === 'out') return { stock: 0 };
  if (status === 'low')
    return { $expr: { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$minStock'] }] } };
  if (status === 'in') return { $expr: { $gt: ['$stock', '$minStock'] } };
  return {};
}

const SORT_FIELDS: Record<string, string> = {
  name: 'name',
  stock: 'stock',
  salePrice: 'salePrice',
  createdAt: 'createdAt',
};

function qStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

// Scopes a single-product lookup to the businesses the user may touch, so one
// tenant can never read or mutate another's product by id. Null on a malformed id.
function scopedFilter(req: Request): Query | null {
  if (!mongoose.isValidObjectId(req.params.id)) return null;
  return { _id: req.params.id, businessId: { $in: getAccessibleBusinessIds(req.user!) } };
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

// GET /products — list, filtered/sorted/paginated, scoped to the user's business.
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

// POST /products — create (admin only). businessId comes from the session, never
// the body, so a client cannot plant a product in another tenant.
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

// GET /products/:id
productRouter.get('/:id', async (req: Request, res: Response) => {
  const filter = scopedFilter(req);
  const product = filter && (await Product.findOne(filter));
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(product.toJSON());
});

// PATCH /products/:id (admin only)
productRouter.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid product', details: parsed.error.flatten() });
    return;
  }
  const filter = scopedFilter(req);
  try {
    const product =
      filter && (await Product.findOneAndUpdate(filter, parsed.data, { new: true, runValidators: true }));
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

// DELETE /products/:id (admin only)
productRouter.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  const filter = scopedFilter(req);
  const product = filter && (await Product.findOneAndDelete(filter));
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.status(204).send();
});
