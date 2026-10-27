import mongoose, { Document, Schema } from 'mongoose';

export interface ISyncCounterPersistent {
  _id: string;
  value: number;
}

export interface SyncCounterDocument extends Document<string> {
  value: number;
}

const SyncCounterSchema = new Schema({
  _id: { type: String, required: true },
  value: { type: Number, required: true, default: 0 },
});

const SyncCounterModel = mongoose.model<SyncCounterDocument>('SyncCounter', SyncCounterSchema);

export default SyncCounterModel;
