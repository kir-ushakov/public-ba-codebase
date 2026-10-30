import path from 'path';

const SAFE_SEGMENT = /^[A-Za-z0-9-]{1,64}$/;
const SAFE_EXTENSION = /^[a-z0-9]{1,8}$/;
const SHARD_LENGTH = 2;

/** imageId is client-generated, so it must be a single safe path segment before any fs call. */
export function isSafeImageId(imageId: string): boolean {
  return SAFE_SEGMENT.test(imageId);
}

/**
 * `<userId>/<shard>/<imageId>.<extension>`, where shard is the first two characters of
 * imageId so a single user folder does not grow into one huge directory.
 * Returns null when any part could escape its folder.
 */
export function buildImageRelativePath(
  userId: string,
  imageId: string,
  extension: string,
): string | null {
  if (!SAFE_SEGMENT.test(userId) || !isSafeImageId(imageId) || !SAFE_EXTENSION.test(extension)) {
    return null;
  }
  const shard = imageId.slice(0, SHARD_LENGTH).toLowerCase();
  return path.posix.join(userId, shard, `${imageId}.${extension}`);
}

/** Absolute path for a stored fileId, or null when it resolves outside rootDir. */
export function resolveInsideRoot(rootDir: string, relativePath: string): string | null {
  const root = path.resolve(rootDir);
  const resolved = path.resolve(root, relativePath);
  if (!resolved.startsWith(root + path.sep)) {
    return null;
  }
  return resolved;
}
