import { ImageUploadContract } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UploadImageError } from './upload-image.errors.js';

/**
 * Internal use case request - adapts API contract for backend use
 * Transforms File | Blob from contract to Express.Multer.File for backend processing
 */
export type UploadImageRequest = Omit<ImageUploadContract.Request, 'file'> & {
  file: Express.Multer.File;
};

/**
 * Use case result type combining response contract with error handling
 */
export type UploadImageResult = Result<ImageUploadContract.Response, UploadImageError>;

