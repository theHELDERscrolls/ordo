import { Schema, model } from 'mongoose';
import { userRoles } from '@ordo/shared';

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
    // Reusing the shared list keeps the database and the contract from disagreeing.
    role: { type: String, enum: [...userRoles], required: true },
  },
  { timestamps: true },
);

// Always strips passwordHash, so a hash cannot leak even if a document is sent as-is.
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

/** A user, always scoped to one Business. `passwordHash` lives only here. */
export const User = model('User', userSchema);
