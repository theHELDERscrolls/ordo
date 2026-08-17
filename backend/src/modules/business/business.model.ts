import { Schema, model } from 'mongoose';

// Branding is embedded rather than its own collection: it belongs to the Business,
// is always read with it, and is bounded in size. No _id, since a sub-object of a
// single parent needs no identity of its own.
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

businessSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const r = ret as Record<string, unknown>;
    delete r._id;
    return r;
  },
});

/** The tenant every other document is scoped to. */
export const Business = model('Business', businessSchema);
