import { randomFillSync } from 'crypto';
import { EApiError, EUploadImageUseCaseError, ImageConst } from '@brainassistant/contracts';
import path from 'path';
import { promises as fsp } from 'fs';
import sharp from 'sharp';
import { Application } from 'express';
import request from 'supertest';
import { MAX_IMAGE_UPLOAD_FILE_BYTES } from '../../../src/modules/files/config.js';
import { UploadImageErrors } from '../../../src/modules/files/usecases/upload-image/upload-image.errors.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

function uploadRoot(): string {
  const root = process.env.FILES_UPLOAD_PATH;
  if (!root) {
    throw new Error('FILES_UPLOAD_PATH is not set');
  }
  return root;
}

function imagesRoot(): string {
  return path.join(uploadRoot(), 'images');
}

async function readStoredImage(imageId: string): Promise<{
  filePath: string;
  format: string | undefined;
  width: number;
  height: number;
  bytes: number;
}> {
  const document = await models.ImageModel.findOne({ imageId }).lean();
  if (!document) {
    throw new Error(`image ${imageId} was not persisted`);
  }
  const filePath = path.join(imagesRoot(), document.fileId);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path from the persisted test document
  const file = await fsp.readFile(filePath);
  const meta = await sharp(file).metadata();
  return {
    filePath,
    format: meta.format,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    bytes: file.length,
  };
}

async function listFilesUnder(dir: string): Promise<string[]> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- per-worker test upload dir
  const entries = await fsp.readdir(dir, { recursive: true, withFileTypes: true }).catch(() => []);
  return entries
    .filter(entry => entry.isFile())
    .map(entry => path.join(entry.parentPath, entry.name));
}

describe('Integration: UploadImage (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Application;
  const TEST_IMAGE_PATH = path.join(process.cwd(), 'test/integration/_fixtures/test-img.jpg');

  beforeAll(async () => {
    await startInMemoryMongo();
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- local test upload fixture dir
    await fsp.mkdir(path.join(uploadRoot(), 'tmp'), { recursive: true });
    app = buildTestApp().app;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
    await fsp.rm(uploadRoot(), {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
  }, 15_000);

  beforeEach(async () => {
    await clearDatabase();
    await fsp.rm(imagesRoot(), { recursive: true, force: true });
  });

  it('returns 401 without auth cookie', async () => {
    const res = await request(app).post('/api/files/image').field('imageId', 'image-unauth');

    expect(res.status).toBe(401);
  });

  it('happy path: stores the file under the user folder and persists metadata', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const imageId = 'image-123';

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/files/image')
      .field('imageId', imageId)
      .attach('file', TEST_IMAGE_PATH)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ imageId });

    const persistedImage = await models.ImageModel.findOne({ imageId }).lean();
    expect(persistedImage).toMatchObject({
      imageId,
      userId,
      storageType: 'local',
      fileId: `${userId}/im/${imageId}.webp`,
      mimeType: 'image/webp',
    });

    const stored = await readStoredImage(imageId);
    expect(stored.format).toBe('webp');
    expect(Math.max(stored.width, stored.height)).toBeLessThanOrEqual(ImageConst.MAX_LONG_EDGE_PX);
    expect(stored.bytes).toBeLessThanOrEqual(ImageConst.MAX_BYTES);
    expect(await listFilesUnder(path.join(uploadRoot(), 'uploads'))).toEqual([]);
  });

  it('treats a repeated upload of the same imageId as one image', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'image-retry';

    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await authenticatedRequest(app, jwtCookie)
        .post('/api/files/image')
        .field('imageId', imageId)
        .attach('file', TEST_IMAGE_PATH);
      expect(res.status).toBe(200);
    }

    expect(await models.ImageModel.countDocuments({ imageId })).toBe(1);
    expect(await listFilesUnder(imagesRoot())).toHaveLength(1);
  });

  it('stores a wide jpeg as webp at the long-edge limit', async () => {
    const { jwtCookie } = await seedTestUser();
    const wide = await sharp({
      create: {
        width: 2400,
        height: 1200,
        channels: 3,
        background: { r: 20, g: 40, b: 80 },
      },
    })
      .jpeg()
      .toBuffer();

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/files/image')
      .field('imageId', 'image-wide')
      .attach('file', wide, { filename: 'wide.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    const stored = await readStoredImage('image-wide');
    expect(stored.format).toBe('webp');
    expect(stored.width).toBe(ImageConst.MAX_LONG_EDGE_PX);
    expect(stored.height).toBe(800);
    expect(stored.bytes).toBeLessThanOrEqual(ImageConst.MAX_BYTES);
  });

  it('keeps a webp that is already inside the store limits', async () => {
    const { jwtCookie } = await seedTestUser();
    const webp = await sharp({
      create: {
        width: 40,
        height: 30,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .webp({ quality: ImageConst.WEBP_QUALITY })
      .toBuffer();

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/files/image')
      .field('imageId', 'image-webp')
      .attach('file', webp, { filename: 'small.webp', contentType: 'image/webp' });

    expect(res.status).toBe(200);
    const stored = await readStoredImage('image-webp');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path from the persisted test document
    expect(await fsp.readFile(stored.filePath)).toEqual(webp);
  });

  it('stores noisy camera-sized input under the byte cap', async () => {
    const { jwtCookie } = await seedTestUser();
    const width = 1400;
    const height = 1400;
    const raw = Buffer.alloc(width * height * 3);
    randomFillSync(raw);
    const jpeg = await sharp(raw, { raw: { width, height, channels: 3 } })
      .jpeg({ quality: 90 })
      .toBuffer();

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/files/image')
      .field('imageId', 'image-noise')
      .attach('file', jpeg, { filename: 'noise.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    const stored = await readStoredImage('image-noise');
    expect(stored.format).toBe('webp');
    expect(Math.max(stored.width, stored.height)).toBeLessThanOrEqual(ImageConst.MAX_LONG_EDGE_PX);
    expect(stored.bytes).toBeLessThanOrEqual(ImageConst.MAX_BYTES);
  }, 30_000);

  it('should reject unsupported file types', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'image-invalid';
    const invalidFilePath = path.join(uploadRoot(), 'tmp', 'test-file.txt');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- local test fixture write
    await fsp.writeFile(invalidFilePath, 'This is a text file');

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/files/image')
      .field('imageId', imageId)
      .attach('file', invalidFilePath)
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.name).toBe(EUploadImageUseCaseError.NotSupportedType);
    expect(res.body).toHaveProperty('message');

    const persistedImage = await models.ImageModel.findOne({ imageId }).lean();
    expect(persistedImage).toBeNull();
  });

  it('rejects an imageId that could escape the user folder', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/files/image')
      .field('imageId', '../escape')
      .attach('file', TEST_IMAGE_PATH);

    expect(res.status).toBe(400);
    expect(res.body.name).toBe(EUploadImageUseCaseError.InvalidImageId);
    expect(res.body).toHaveProperty('message');
    expect(await models.ImageModel.countDocuments()).toBe(0);
    expect(await listFilesUnder(imagesRoot())).toEqual([]);
    expect(await listFilesUnder(path.join(uploadRoot(), 'uploads'))).toEqual([]);
  });

  it('ignores directory parts of the uploaded file name', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const imageId = 'image-traversal-name';

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/files/image')
      .field('imageId', imageId)
      .attach('file', TEST_IMAGE_PATH, { filename: '../../escape.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(await listFilesUnder(imagesRoot())).toEqual([
      path.join(imagesRoot(), userId, 'im', `${imageId}.webp`),
    ]);
    await expect(fsp.access(path.join(uploadRoot(), 'escape.jpg'))).rejects.toThrow();
  });

  it('rejects a file larger than MAX_IMAGE_UPLOAD_FILE_BYTES', async () => {
    const { jwtCookie } = await seedTestUser();
    const oversized = Buffer.alloc(MAX_IMAGE_UPLOAD_FILE_BYTES + 1);

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/files/image')
      .field('imageId', 'image-too-big')
      .attach('file', oversized, { filename: 'huge.jpg', contentType: 'image/jpeg' });

    const error = UploadImageErrors.FileTooLarge();
    expect(res.status).toBe(error.httpCode);
    expect(res.body).toEqual({ name: error.code, message: error.message });
    expect(await models.ImageModel.findOne({ imageId: 'image-too-big' }).lean()).toBeNull();
  });

  it('returns UNEXPECTED_ERROR when multer cannot write the upload temp dir', async () => {
    const { jwtCookie } = await seedTestUser();
    const tmpDir = path.join(uploadRoot(), 'tmp');
    await fsp.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- local test fixture
    await fsp.writeFile(tmpDir, 'not-a-directory');

    try {
      const res = await authenticatedRequest(app, jwtCookie)
        .post('/api/files/image')
        .field('imageId', 'image-unwritable-tmp')
        .attach('file', TEST_IMAGE_PATH);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        name: EApiError.Unexpected,
        message: 'Some unexpected error occurred',
      });
      expect(
        await models.ImageModel.findOne({ imageId: 'image-unwritable-tmp' }).lean(),
      ).toBeNull();
    } finally {
      await fsp.rm(tmpDir, { force: true });
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- local test upload fixture dir
      await fsp.mkdir(tmpDir, { recursive: true });
    }
  });
});
