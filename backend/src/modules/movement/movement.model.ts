import { Schema, model, type Types } from 'mongoose';
import { movementTypes, type MovementType } from '@ordo/shared';

const movementSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Reusing the shared list keeps the database and the contract from disagreeing.
    type: { type: String, enum: [...movementTypes], required: true },
    // Always positive: the sign lives in `type`, so a quantity is never ambiguous.
    quantity: { type: Number, required: true, min: 0 },
    // Denormalised on purpose: without it the history cannot say what a movement
    // left behind without replaying the whole ledger on every read.
    resultingStock: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  // A ledger is append-only, so a movement has a creation date and nothing else.
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The history, newest first, and one product's own sheet. Both start with the
// field they filter on, so neither needs a separate single-field index.
movementSchema.index({ businessId: 1, createdAt: -1 });
movementSchema.index({ productId: 1, createdAt: -1 });

movementSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const r = ret as Record<string, unknown>;
    delete r._id;
    return r;
  },
});

/** One recorded change to a product's stock. Never edited, never deleted alone. */
export const StockMovement = model('StockMovement', movementSchema);

/**
 * Appends a movement for a product whose new stock has already been written.
 * `resultingStock` is read from that saved value rather than recomputed, so the
 * ledger cannot end up claiming something the catalogue disagrees with.
 *
 * Every path that changes stock goes through here: the movements endpoint, the
 * product form, and the CSV import.
 */
export function recordMovement(
  product: { _id: Types.ObjectId; businessId: Types.ObjectId; stock: number },
  userId: string,
  type: MovementType,
  quantity: number,
  reason?: string,
) {
  return StockMovement.create({
    businessId: product.businessId,
    productId: product._id,
    type,
    quantity,
    resultingStock: product.stock,
    reason,
    userId,
  });
}
