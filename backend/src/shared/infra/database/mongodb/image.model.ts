import mongoose, { Document, Schema } from 'mongoose';

export interface IImagePersistent {
  _id?: string;
  imageId: string;
  userId: string;
  storageType: 'local' | 'googleDrive';
  fileId: string;
}

export interface ImageDocument extends IImagePersistent, Document<string> {}

const ImageSchema = new Schema({
  imageId: { type: String, require: true },
  userId: { type: String, require: true },
  storageType: { type: String, require: true, default: 'googleDrive' },
  fileId: { type: String, default: null },
});

const ImageModel = mongoose.model<ImageDocument>('Image', ImageSchema);

export default ImageModel;
