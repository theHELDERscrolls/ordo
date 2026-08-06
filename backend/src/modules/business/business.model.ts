import { Schema, model } from 'mongoose';

// Branding is embedded (a sub-document), not a separate collection: it belongs to
// the Business, is always read with it, and is bounded in size. _id disabled
// because a sub-object does not need its own identity.
const brandingSchema = new Schema(
  {
    logoUrl: { type: String },
    faviconUrl: { type: String },
    accentColor: { type: String, required: true },
  },
  { _id: false },
);

const businessSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    branding: { type: brandingSchema, required: true },
  },
  { timestamps: true },
);

// Serialize to the public wire shape: expose `id`, drop `_id` and `__v`.
businessSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const r = ret as Record<string, unknown>;
    delete r._id;
    return r;
  },
});

export const Business = model('Business', businessSchema);
