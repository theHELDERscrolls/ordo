import express from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createMovementSchema, movementTypeSchema } from '@ordo/shared';
import { StockMovement, recordMovement } from './movement.model.js';
import { Product } from '../product/product.model.js';
import { requireAuth, loadUser } from '../auth/auth.middleware.js';
import { getAccessibleBusinessIds } from '../user/user.access.js';

/** A Mongo query, assembled incrementally with operators such as `$in` and `$gte`. */
type Query = Record<string, unknown>;

/**
 * The stock ledger. Both reading and recording are open to any member of the
 * business: an `employee` is who actually moves the stock behind a counter, and a
 * shop where every sale has to wait for the owner to type it is a shop that stops
 * recording sales. What stays `admin`-only is the catalogue itself — prices, the
 * reorder point, creating and deleting products — which is where the damage would
 * be.
 *
 * There is no update and no delete: a ledger is append-only, and a mistake is
 * corrected with an opposing movement, which is what keeps the trail honest even
 * with more hands writing to it.
 */
export const movementRouter = express.Router();

movementRouter.use(requireAuth, loadUser);

// Resolved server-side so the history table renders from a single request.
const POPULATE = [
  { path: 'productId', select: 'name sku' },
  { path: 'userId', select: 'name' },
];

/** A movement as it comes back from {@link POPULATE}, before it is flattened. */
type PopulatedMovement = {
  _id: mongoose.Types.ObjectId;
  businessId: mongoose.Types.ObjectId;
  productId: { _id: mongoose.Types.ObjectId; name: string; sku: string } | null;
  type: string;
  quantity: number;
  resultingStock: number;
  reason?: string;
  userId: { _id: mongoose.Types.ObjectId; name: string } | null;
  createdAt: Date;
};

/**
 * Flattens the populated references into the shape `movementSchema` declares. A
 * reference that no longer resolves empties its fields instead of dropping the
 * row: the history has to survive the disappearance of what it refers to.
 */
function toMovementJson(movement: PopulatedMovement) {
  return {
    id: String(movement._id),
    businessId: String(movement.businessId),
    productId: String(movement.productId?._id ?? ''),
    productName: movement.productId?.name ?? '',
    productSku: movement.productId?.sku ?? '',
    type: movement.type,
    quantity: movement.quantity,
    resultingStock: movement.resultingStock,
    reason: movement.reason,
    userId: String(movement.userId?._id ?? ''),
    userName: movement.userId?.name ?? '',
    createdAt: movement.createdAt.toISOString(),
  };
}

function qStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

/**
 * Parses a date bound, ignoring anything unparseable. A bare `YYYY-MM-DD` from a
 * date input means the whole day, so an upper bound lands at its last millisecond
 * instead of at its midnight — otherwise "up to today" would hide today.
 */
function parseDate(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (endOfDay && !value.includes('T')) date.setUTCHours(23, 59, 59, 999);
  return date;
}

/** `GET /movements` — the tenant's history, newest first, filtered and paginated. */
movementRouter.get('/', async (req: Request, res: Response) => {
  const filter: Query = { businessId: { $in: getAccessibleBusinessIds(req.user!) } };

  const productId = qStr(req.query.productId);
  if (productId) {
    // Ignoring a malformed id would answer with the whole history to someone who
    // asked for one product, which is worse than refusing.
    if (!mongoose.isValidObjectId(productId)) {
      res.status(400).json({ error: 'Invalid productId' });
      return;
    }
    filter.productId = productId;
  }

  const type = movementTypeSchema.safeParse(req.query.type);
  if (type.success) filter.type = type.data;

  const from = parseDate(qStr(req.query.from));
  const to = parseDate(qStr(req.query.to), true);
  if (from || to) {
    filter.createdAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const [items, total] = await Promise.all([
    StockMovement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE)
      .lean<PopulatedMovement[]>(),
    StockMovement.countDocuments(filter),
  ]);

  res.json({ items: items.map(toMovementJson), total, page, limit });
});

/**
 * `POST /movements` — record an entry or an exit, for any member of the business.
 * The stock and the ledger move together, and `adjust` is not accepted here: a
 * correction is something the system writes, never something a client declares.
 */
movementRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createMovementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid movement', details: parsed.error.flatten() });
    return;
  }
  const { productId, type, quantity, reason } = parsed.data;

  if (!mongoose.isValidObjectId(productId)) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const scope: Query = {
    _id: productId,
    businessId: { $in: getAccessibleBusinessIds(req.user!) },
  };

  // The availability check and the decrement are one atomic update, so two
  // concurrent exits cannot both pass the check and drive the stock negative.
  const guarded = type === 'out' ? { ...scope, stock: { $gte: quantity } } : scope;
  const product = await Product.findOneAndUpdate(
    guarded,
    { $inc: { stock: type === 'in' ? quantity : -quantity } },
    { returnDocument: 'after' },
  );
  if (!product) {
    // Nothing matched: either the product is not the caller's, or the guard
    // rejected the exit. Only the second is a conflict.
    const exists = type === 'out' && (await Product.exists(scope));
    res
      .status(exists ? 409 : 404)
      .json({ error: exists ? 'Insufficient stock' : 'Product not found' });
    return;
  }

  // ponytail: no transaction — a standalone MongoDB has none, and the deployment
  // is a single node. If this insert failed the stock would sit ahead of the
  // ledger; wrap both in a session if it ever moves to a replica set.
  const created = await recordMovement(product, req.user!.id, type, quantity, reason);
  const movement = await StockMovement.findById(created._id)
    .populate(POPULATE)
    .lean<PopulatedMovement>();

  res.status(201).json(toMovementJson(movement!));
});
