import { Schema, model } from 'mongoose';
import type { StockStatus } from '@ordo/shared';
import { stockStatusOf } from './product.status.js';

const productSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String, trim: true },
    supplier: { type: String, trim: true },
    unit: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
    minStock: { type: Number, required: true, default: 0, min: 0 },
    costPrice: { type: Number, required: true, default: 0, min: 0 },
    salePrice: { type: Number, required: true, default: 0, min: 0 },
    imageUrl: { type: String },
  },
  { timestamps: true },
);

// Per business, not global: two shops can both stock an "A-100". This is also the
// identity the future CSV import will upsert on.
productSchema.index({ businessId: 1, sku: 1 }, { unique: true });

// Derived, never stored: the threshold itself lives in product.status.ts, so the
// list badge, the filters and the dashboard counts cannot drift apart.
productSchema.virtual('stockStatus').get(function (): StockStatus {
  return stockStatusOf(this.stock, this.minStock);
});

productSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const r = ret as Record<string, unknown>;
    delete r._id;
    return r;
  },
});

/** A product in a Business's catalogue, identified within it by `sku`. */
export const Product = model('Product', productSchema);
