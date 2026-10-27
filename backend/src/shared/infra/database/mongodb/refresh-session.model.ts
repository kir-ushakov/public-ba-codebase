import mongoose, { Document, Schema } from 'mongoose';

export interface RefreshSessionDocument extends Document {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

const refreshSessionSchema = new Schema({
  userId: { type: String, required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

// Abandoned rows are removed when expiresAt passes. The use case still rejects
// an expired token itself; this index only stops the collection from growing.
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshSessionModel = mongoose.model<RefreshSessionDocument>(
  'RefreshSession',
  refreshSessionSchema,
);

export default RefreshSessionModel;
