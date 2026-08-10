import { Schema, model } from 'mongoose';

// A product belongs to a Business (the tenant scope). `sku` is unique WITHIN a
// business (see the compound index below), which is the identity the future CSV
// import relies on to update-or-create instead of duplicating.
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

// SKU uniqueness is per business, not global: two shops can both have "A-100".
productSchema.index({ businessId: 1, sku: 1 }, { unique: true });

// Derived, never stored: the reorder signal the list badge and the dashboard use.
productSchema.virtual('stockStatus').get(function (): 'in' | 'low' | 'out' {
  if (this.stock === 0) return 'out';
  if (this.stock <= this.minStock) return 'low';
  return 'in';
});

// Serialize to the public wire shape: expose `id` and `stockStatus` (virtuals),
// drop `_id` and `__v`.
productSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const r = ret as Record<string, unknown>;
    delete r._id;
    return r;
  },
});

export const Product = model('Product', productSchema);
