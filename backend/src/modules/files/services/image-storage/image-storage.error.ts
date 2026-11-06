/** Backend-only: use cases map these into their own wire codes. */
export enum EImageStorageError {
  InvalidPath = 'IMAGE_STORAGE_ERROR__INVALID_PATH',
  WriteFailed = 'IMAGE_STORAGE_ERROR__WRITE_FAILED',
  FileMissing = 'IMAGE_STORAGE_ERROR__FILE_MISSING',
  ReadFailed = 'IMAGE_STORAGE_ERROR__READ_FAILED',
}
