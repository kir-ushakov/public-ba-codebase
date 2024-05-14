import mongoose, { Document, Schema } from 'mongoose';

export interface VerificationTokenDocument extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  createdAt: Date;
}

const verificationTokenSchema = new Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
      default: Date.now,
      expires: 30 * 24 * 60, // 30 days
    },
  },
  { timestamps: true }
);

const VerificationTokenModel = mongoose.model<VerificationTokenDocument>(
  'VerificationToken',
  verificationTokenSchema
);

export default VerificationTokenModel;
