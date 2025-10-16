import { ImageUploadContract } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UploadImageError } from './upload-image.errors.js';

/**
 * Upload Image Use Case Contract
 * 
 * Adapts external API contract (ImageUploadContract) for internal backend use.
 * Transforms browser file types to server-side Multer file types.
 */

/**
 * Internal use case request - adapts external contract for backend
 * 
 * External: ImageUploadContract.Request - what client sends
 *   { imageId: string, file: File | Blob }
 * 
 * Internal: UploadImageRequest - adapted for backend processing
 *   { imageId: string, file: Express.Multer.File }
 * 
 * Transformation: File | Blob → Express.Multer.File (handled by Multer middleware)
 */
export type UploadImageRequest = Omit<ImageUploadContract.Request, 'file'> & {
  file: Express.Multer.File;  // Transformed by Multer middleware from File | Blob
};

/**
 * Use case result type combining response contract with error handling
 */
export type UploadImageResult = Result<ImageUploadContract.Response, UploadImageError>;

