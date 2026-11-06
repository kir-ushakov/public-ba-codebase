/** Multer `limits.fileSize` for image upload — shared by app router and integration tests. */
export const MAX_IMAGE_UPLOAD_FILE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_UPLOAD_EXTENSIONS: readonly string[] = ['png', 'jpeg', 'jpg', 'webp'];

/** `ImageResizeService.prepareForStore` always yields WebP. */
export const STORED_IMAGE_FORMAT = { extension: 'webp', mimeType: 'image/webp' } as const;

/** Bytes behind an imageId never change; the response is per-user, so no shared caches. */
export const IMAGE_CACHE_CONTROL = 'private, max-age=31536000, immutable';
