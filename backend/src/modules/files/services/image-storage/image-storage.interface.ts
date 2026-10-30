import { Readable } from 'stream';
import { Result } from '../../../../shared/core/result.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { EImageStorageError } from './image-storage.error.js';

export type PutImageParams = {
  userId: string;
  imageId: string;
  /** Prepared file; the storage takes ownership and moves it. */
  sourcePath: string;
  extension: string;
};

export type StoredImageFile = {
  data: Readable;
  sizeBytes: number;
  modifiedAt: Date;
};

export type ImageStorageResult<T> = Result<T, ServiceError<EImageStorageError>>;

export interface IImageStorage {
  /** Returns the storage-specific fileId to persist on the Image. */
  put(params: PutImageParams): Promise<ImageStorageResult<string>>;
  get(fileId: string): Promise<ImageStorageResult<StoredImageFile>>;
}
