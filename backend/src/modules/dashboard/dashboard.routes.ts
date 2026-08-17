import express from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../product/product.model.js';
import { stockStatusExpr } from '../product/product.status.js';
import { requireAuth, loadUser } from '../auth/auth.middleware.js';
import { getAccessibleBusinessIds } from '../user/user.access.js';

// The tail of a value ranking is flat by definition, so the curve's shape is all
// in the head and sending the rest would only cost payload.
const TOP_PRODUCTS = 20;

/** Read-only figures behind the dashboard panel. */
export const dashboardRouter = express.Router();

dashboardRouter.use(requireAuth, loadUser);

/** aggregate() does not auto-cast, so the tenant scope has to be real ObjectIds. */
const scopeOf = (req: Request) =>
  getAccessibleBusinessIds(req.user!).map((id) => new mongoose.Types.ObjectId(id));

/**
 * `GET /dashboard/stats` — the panel's four figures. Aggregated rather than
 * counted in memory, so the totals never require loading every document.
 */
dashboardRouter.get('/stats', async (req: Request, res: Response) => {
  const businessIds = scopeOf(req);

  const [agg] = await Product.aggregate([
    { $match: { businessId: { $in: businessIds } } },
    {
      $group: {
        _id: null,
        productCount: { $sum: 1 },
        lowStockCount: { $sum: { $cond: [stockStatusExpr.low, 1, 0] } },
        outOfStockCount: { $sum: { $cond: [stockStatusExpr.out, 1, 0] } },
        inventoryValue: { $sum: { $multiply: ['$stock', '$costPrice'] } },
      },
    },
  ]);

  res.json({
    productCount: agg?.productCount ?? 0,
    lowStockCount: agg?.lowStockCount ?? 0,
    outOfStockCount: agg?.outOfStockCount ?? 0,
    inventoryValue: agg?.inventoryValue ?? 0,
  });
});

/**
 * `GET /dashboard/inventory-breakdown` — where the capital sits, for the panel's
 * two charts. A single `$facet` runs the three views over the same `$match` and
 * the same derived `value`, so both charts arrive in one round trip and cannot
 * disagree about the total. Worthless products drop out of the ranking only; they
 * still count towards the catalogue.
 */
dashboardRouter.get('/inventory-breakdown', async (req: Request, res: Response) => {
  const businessIds = scopeOf(req);

  const [agg] = await Product.aggregate([
    { $match: { businessId: { $in: businessIds } } },
    { $set: { value: { $multiply: ['$stock', '$costPrice'] } } },
    {
      $facet: {
        totals: [
          { $group: { _id: null, totalValue: { $sum: '$value' }, productCount: { $sum: 1 } } },
        ],
        byCategory: [
          {
            $group: {
              // An absent category and an empty one are one bucket; the UI names it,
              // so the API does not invent a label.
              _id: { $ifNull: ['$category', ''] },
              value: { $sum: '$value' },
              productCount: { $sum: 1 },
            },
          },
          { $project: { _id: 0, category: '$_id', value: 1, productCount: 1 } },
          { $sort: { value: -1 } },
        ],
        topProducts: [
          { $match: { value: { $gt: 0 } } },
          { $sort: { value: -1 } },
          { $limit: TOP_PRODUCTS },
          { $project: { _id: 0, id: { $toString: '$_id' }, name: 1, sku: 1, value: 1 } },
        ],
      },
    },
  ]);

  res.json({
    totalValue: agg?.totals[0]?.totalValue ?? 0,
    productCount: agg?.totals[0]?.productCount ?? 0,
    byCategory: agg?.byCategory ?? [],
    topProducts: agg?.topProducts ?? [],
  });
});
