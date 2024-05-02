import mongoose, { Document, Schema } from 'mongoose';

export interface IClientPersistent {
  _id?: string;
  userId: string;
  syncTime: Date;
}

export interface ClientDocument extends IClientPersistent, Document<string> {}

const ClientSchema = new Schema({
  userId: { type: String, require: true },
  syncTime: { type: Date, default: null },
});

const ClientModel = mongoose.model<ClientDocument>('Client', ClientSchema);

export default ClientModel;
