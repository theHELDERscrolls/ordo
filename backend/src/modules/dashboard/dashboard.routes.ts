import express from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product } from '../product/product.model.js';
import { requireAuth, loadUser } from '../auth/auth.middleware.js';
import { getAccessibleBusinessIds } from '../user/user.access.js';

export const dashboardRouter = express.Router();
dashboardRouter.use(requireAuth, loadUser);

// GET /dashboard/stats: the inventory snapshot, computed server-side in one pass.
// Uses aggregation (not find) so counts and value never require loading every doc;
// aggregate does not auto-cast, hence the explicit ObjectId conversion.
dashboardRouter.get('/stats', async (req: Request, res: Response) => {
  const businessIds = getAccessibleBusinessIds(req.user!).map(
    (id) => new mongoose.Types.ObjectId(id),
  );

  const [agg] = await Product.aggregate([
    { $match: { businessId: { $in: businessIds } } },
    {
      $group: {
        _id: null,
        productCount: { $sum: 1 },
        lowStockCount: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$minStock'] }] },
              1,
              0,
            ],
          },
        },
        outOfStockCount: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } },
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
