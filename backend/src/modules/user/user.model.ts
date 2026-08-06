import { Schema, model } from 'mongoose';
import { userRoles } from '@ordo/shared';

// A user always belongs to a Business (the tenant scope). passwordHash lives only
// here, in the storage model, never in the shared wire contract.
const userSchema = new Schema(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    // Roles reuse the shared list, so the DB and the contract can never disagree.
    role: { type: String, enum: [...userRoles], required: true },
  },
  { timestamps: true },
);

// Serialize to the public wire shape: expose `id`, and ALWAYS strip passwordHash
// and internal fields so a hash can never leak even if a document is sent as-is.
userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const r = ret as Record<string, unknown>;
    delete r._id;
    delete r.passwordHash;
    return r;
  },
});

export const User = model('User', userSchema);
