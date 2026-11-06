import mongoose, { Document, Schema } from 'mongoose';

export interface RefreshSessionDocument extends Document {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  /** Stable across rotations of one login. Absent on rows written before families existed. */
  familyId?: string;
  /** Set when the refresh token was spent. Absent or null while the token is still live. */
  consumedAt?: Date | null;
}

const refreshSessionSchema = new Schema({
  userId: { type: String, required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  familyId: { type: String },
  consumedAt: { type: Date },
});

// Spent rows stay until expiresAt. Rotation pushes that date forward with the
// new session, so a replay can still be recognized until the active session
// itself expires. The use case also rejects an expired token on its own.
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Logout and reuse delete or extend every row that shares a familyId.
refreshSessionSchema.index({ familyId: 1 });

const RefreshSessionModel = mongoose.model<RefreshSessionDocument>(
  'RefreshSession',
  refreshSessionSchema,
);

export default RefreshSessionModel;
