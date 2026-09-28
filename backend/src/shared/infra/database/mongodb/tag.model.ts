import mongoose, { Document, Schema } from 'mongoose';
import { TagPersistent } from '../../../domain/models/tag.js';

export interface TagDocument extends Omit<TagPersistent, '_id'>, Document<string> {}

const TagSchema = new Schema({
  _id: { type: String, require: true },
  userId: { type: String, require: true },
  name: { type: String, require: true },
  color: { type: String, require: true },
  createdAt: { type: Date, require: true },
  modifiedAt: { type: Date, require: true },
});

const TagModel = mongoose.model<TagDocument>('Tag', TagSchema);

export default TagModel;
