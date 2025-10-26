/**
 * File upload contracts
 */

/**
 * Image Upload Contract
 * 
 * Defines the contract for image upload API endpoint.
 * Groups Request and Response types for clear relationship.
 */
export namespace UploadImageContract {
/**
 * Image Upload Request
 * 
 * Frontend sends FormData with:
 * - file: Blob (binary file data)
 * - imageId: string (as form field)
 * 
 * Backend receives as Express.Multer.File via multer middleware
 */
export interface Request {
  /**
   * Unique identifier for the image
   * Sent as form field: formData.append('imageId', value)
   */
  imageId: string;
  
  /**
   * The image file itself
   * Frontend sends: Blob
   * Backend receives: Express.Multer.File (after multer middleware)
   */
  file: Blob;
}

  /**
   * Image Upload Response
   * Returns the imageId to confirm successful upload
   */
  export type Response = {
    imageId: string;
  };
}

