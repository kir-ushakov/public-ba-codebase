import path from 'path';
import {
  buildImageRelativePath,
  isSafeImageId,
  resolveInsideRoot,
} from '../../../src/modules/files/services/image-storage/image-storage-path.function.js';

const USER_ID = '64b7f0c2a1b2c3d4e5f60718';

describe('buildImageRelativePath', () => {
  it('places the image in the user folder under a two-character shard', () => {
    expect(buildImageRelativePath(USER_ID, '9F3a-b2', 'webp')).toBe(`${USER_ID}/9f/9F3a-b2.webp`);
  });

  it('accepts a uuid v4 the way the PWA generates it', () => {
    const imageId = '0d9c4a52-7b3e-4f1a-9c2d-2e6f8a1b3c4d';
    expect(buildImageRelativePath(USER_ID, imageId, 'webp')).toBe(`${USER_ID}/0d/${imageId}.webp`);
  });

  it.each(['../x', 'a/b', 'a\\b', '.', '', 'x'.repeat(65), 'id with space'])(
    'rejects unsafe imageId %p',
    imageId => {
      expect(isSafeImageId(imageId)).toBe(false);
      expect(buildImageRelativePath(USER_ID, imageId, 'webp')).toBeNull();
    },
  );

  it('rejects an unsafe userId or extension', () => {
    expect(buildImageRelativePath('../root', 'image-1', 'webp')).toBeNull();
    expect(buildImageRelativePath(USER_ID, 'image-1', '../webp')).toBeNull();
  });
});

describe('resolveInsideRoot', () => {
  const root = path.resolve('storage-root');

  it('resolves a stored fileId inside the root', () => {
    expect(resolveInsideRoot(root, `${USER_ID}/im/image-1.webp`)).toBe(
      path.join(root, USER_ID, 'im', 'image-1.webp'),
    );
  });

  it.each(['../outside.webp', `${USER_ID}/../../outside.webp`, '', path.resolve('/etc/passwd')])(
    'refuses %p',
    fileId => {
      expect(resolveInsideRoot(root, fileId)).toBeNull();
    },
  );
});
