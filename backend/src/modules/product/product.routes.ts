import express from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  createProductSchema,
  importModeSchema,
  stockStatusSchema,
  updateProductSchema,
  type ImportResult,
} from '@ordo/shared';
import { Product } from './product.model.js';
import { stockStatusExpr } from './product.status.js';
import { PRODUCT_CSV_COLUMNS, readProductRow } from './product.csv.js';
import { parseCsv, spanishCsv, toCsv } from '../../lib/csv.js';
import { StockMovement, recordMovement } from '../movement/movement.model.js';
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

// Excel reads a CSV as ANSI unless the file opens with a UTF-8 BOM, which turns
// every accent into mojibake on a double click.
const BOM = '\uFEFF';

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

/**
 * The list's filter: the caller's businesses plus whatever the query narrows it
 * to. Shared with the CSV export, so what you export is what you are looking at.
 */
function buildProductFilter(req: Request): Query {
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
  return filter;
}

/** The list's sort, allowlisted by {@link SORT_FIELDS}. Shared with the export. */
function buildProductSort(req: Request): Record<string, 1 | -1> {
  const field = SORT_FIELDS[qStr(req.query.sort) ?? 'name'] ?? 'name';
  return { [field]: req.query.order === 'desc' ? -1 : 1 };
}

/** `GET /products` — the tenant's catalogue, filtered, sorted and paginated. */
productRouter.get('/', async (req: Request, res: Response) => {
  const filter = buildProductFilter(req);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(buildProductSort(req))
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({ items: items.map((p) => p.toJSON()), total, page, limit });
});

/**
 * `GET /products/export.csv` — the inventory as a spreadsheet. Same filters and
 * sort as the list and no pagination: you export what you are looking at, not the
 * page you happen to be on. Declared before `/:id` so it is not read as an id.
 *
 * Written the way a Spanish Excel expects it — `;`, `22,8`, and the BOM without
 * which it renders the accents as mojibake — so the file opens in columns on a
 * double click. The import detects both conventions, so this still round-trips.
 */
productRouter.get('/export.csv', async (req: Request, res: Response) => {
  const products = await Product.find(buildProductFilter(req)).sort(buildProductSort(req)).lean();
  const date = new Date().toISOString().slice(0, 10);
  res
    .type('text/csv; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="ordo-inventario-${date}.csv"`)
    .send(BOM + toCsv(products, [...PRODUCT_CSV_COLUMNS], spanishCsv));
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
    // A product that arrives with stock arrives with a history: the opening
    // balance is a movement like any other, or the ledger would start with a gap.
    if (product.stock > 0) {
      await recordMovement(product, req.user!.id, 'in', product.stock, 'Stock inicial');
    }
    res.status(201).json(product.toJSON());
  } catch (err) {
    if (isDuplicateKey(err)) {
      res.status(409).json({ error: 'A product with this SKU already exists' });
      return;
    }
    throw err;
  }
});

/** Every movement an import leaves behind says where it came from. */
const IMPORT_REASON = 'Importación CSV';

/**
 * `POST /products/import` — bulk load the catalogue from a spreadsheet (role
 * `admin`). Identity is `(businessId, sku)`, the pair the unique index already
 * enforces: a known SKU updates, an unknown one creates.
 *
 * A bad row is reported with its line and skipped, never aborting the file, and
 * `dryRun` (the default) reports exactly what the real run would do without
 * writing anything.
 */
productRouter.post(
  '/import',
  requireAdmin,
  express.text({ type: 'text/csv', limit: '1mb' }),
  async (req: Request, res: Response) => {
    if (typeof req.body !== 'string') {
      res.status(415).json({ error: 'Send the file as text/csv' });
      return;
    }
    const rows = parseCsv(req.body);
    // No header, or a header this catalogue cannot be keyed by. Either way there
    // is nothing to import, and guessing the columns would be worse than saying so.
    const columns = Object.keys(rows[0] ?? {});
    if (!columns.includes('sku') || !columns.includes('name')) {
      res.status(400).json({ error: 'The CSV needs a header with sku and name, and at least one row' });
      return;
    }

    const dryRun = req.query.dryRun !== 'false';
    const mode = importModeSchema.safeParse(req.query.quantityMode).data ?? 'set';
    const businessId = req.user!.businessId;

    // One read for the whole file: the rows are matched in memory rather than
    // with a query each.
    const known = new Map(
      (await Product.find({ businessId, sku: { $in: rows.map((row) => row.sku) } }).lean()).map(
        (product) => [product.sku, product] as const,
      ),
    );

    const result: ImportResult = {
      dryRun,
      total: rows.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    const seen = new Set<string>();

    for (const [index, row] of rows.entries()) {
      // The header is line 1, so the first data row is line 2 in the spreadsheet.
      const line = index + 2;
      const fail = (message: string) => {
        result.skipped++;
        result.errors.push({ row: line, sku: row.sku || undefined, message });
      };

      // Two rows for one SKU are always a mistake in the file, and applying both
      // would leave the ledger disagreeing with the stock: the second row would be
      // computed from a value the first has already moved.
      if (row.sku && seen.has(row.sku)) {
        fail('Duplicate SKU in the file');
        continue;
      }
      seen.add(row.sku);

      const current = known.get(row.sku);
      const input = readProductRow(row);
      // A create has to be complete; an update only carries what the file filled in.
      const parsed = current
        ? updateProductSchema.safeParse(input)
        : createProductSchema.safeParse(input);
      if (!parsed.success) {
        fail(parsed.error.issues.map((i) => `${i.path.join('.') || 'row'}: ${i.message}`).join('; '));
        continue;
      }

      // In `add` mode the column is an amount to add, so what lands on the product
      // is the sum, and the movement's quantity is the increment itself.
      const data = parsed.data;
      const stock =
        data.stock === undefined
          ? undefined
          : current && mode === 'add'
            ? current.stock + data.stock
            : data.stock;

      if (dryRun) {
        if (current) result.updated++;
        else result.created++;
        continue;
      }

      try {
        if (current) {
          const product = await Product.findOneAndUpdate(
            { _id: current._id },
            { ...data, ...(stock !== undefined && { stock }) },
            { returnDocument: 'after', runValidators: true },
          );
          if (!product) {
            fail('Product disappeared while importing');
            continue;
          }
          result.updated++;
          if (product.stock !== current.stock) {
            await recordMovement(
              product,
              req.user!.id,
              mode === 'add' ? 'in' : 'adjust',
              Math.abs(product.stock - current.stock),
              IMPORT_REASON,
            );
          }
        } else {
          const product = await Product.create({ ...data, stock, businessId });
          result.created++;
          if (product.stock > 0) {
            await recordMovement(product, req.user!.id, 'in', product.stock, IMPORT_REASON);
          }
        }
      } catch (err) {
        if (!isDuplicateKey(err)) throw err;
        // Two rows creating the same new SKU: the second one is the duplicate.
        fail('A product with this SKU already exists');
      }
    }

    res.json(result);
  },
);

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
    // Only pay for the extra read when the patch can actually move the stock: the
    // size of the correction is the difference, which needs the previous value.
    const before =
      filter && parsed.data.stock !== undefined
        ? await Product.findOne(filter).select('stock').lean()
        : null;
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
    if (before && before.stock !== product.stock) {
      const size = Math.abs(product.stock - before.stock);
      await recordMovement(product, req.user!.id, 'adjust', size, 'Ajuste manual');
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
  // The history goes with the product: a ledger of movements against something
  // that no longer exists explains nothing and cannot be browsed.
  await StockMovement.deleteMany({ productId: product._id });
  res.status(204).send();
});
