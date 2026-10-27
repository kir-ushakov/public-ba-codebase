import mongoose, { Document, Schema } from 'mongoose';

export interface IClientPersistent {
  _id?: string;
  userId: string;
}

export interface ClientDocument extends Omit<IClientPersistent, '_id'>, Document<string> {}

const ClientSchema = new Schema({
  userId: { type: String, require: true },
});

const ClientModel = mongoose.model<ClientDocument>('Client', ClientSchema);

export default ClientModel;
