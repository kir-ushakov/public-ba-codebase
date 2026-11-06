import mongoose, { Document, Schema } from 'mongoose';

export interface IImagePersistent {
  _id?: string;
  imageId: string;
  userId: string;
  storageType: 'local' | 'googleDrive';
  /** Storage-specific locator: relative path for `local`, Drive file id for `googleDrive`. */
  fileId: string;
  mimeType: string;
}

export interface ImageDocument extends Omit<IImagePersistent, '_id'>, Document<string> {}

const ImageSchema = new Schema({
  imageId: { type: String, require: true },
  userId: { type: String, require: true },
  storageType: { type: String, require: true, default: 'local' },
  fileId: { type: String, default: null },
  mimeType: { type: String, require: true },
});

// Every image GET looks up by owner + client id; also makes a retried upload an upsert.
ImageSchema.index({ userId: 1, imageId: 1 }, { unique: true });

const ImageModel = mongoose.model<ImageDocument>('Image', ImageSchema);

export default ImageModel;
