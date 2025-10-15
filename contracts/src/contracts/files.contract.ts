/**
 * File upload contracts
 */

/**
 * Image Upload Contract
 * 
 * Defines the contract for image upload API endpoint.
 * Groups Request and Response types for clear relationship.
 */
export namespace ImageUploadContract {
  /**
   * Image Upload Request
   * 
   * Sent as multipart/form-data with two fields:
   * 
   * Frontend (FormData):
   * ```typescript
   * const formData = new FormData();
   * formData.append('file', blob, filename);  // Binary file data
   * formData.append('imageId', imageId);      // String field
   * ```
   * 
   * Backend (Multer middleware):
   * ```typescript
   * req.file       // Express.Multer.File - the uploaded file
   * req.body.imageId  // string - the imageId field
   * ```
   */
  export type Request = {
    /**
     * Unique identifier for the image
     * Sent as form field: formData.append('imageId', value)
     */
    imageId: string;
    
    /**
     * The image file itself
     * Sent as form field: formData.append('file', blob, filename)
     * Backend receives as: req.file (Express.Multer.File)
     */
    file: File | Blob;
  };

  /**
   * Image Upload Response
   * Returns the imageId to confirm successful upload
   */
  export type Response = {
    imageId: string;
  };
}

// Convenience exports for backward compatibility and simpler imports
export type ImageUploadRequest = ImageUploadContract.Request;
export type ImageUploadResponse = ImageUploadContract.Response;

