import { EGetImageUseCaseError, ImageConst } from '@brainassistant/contracts';
import path from 'path';
import { promises as fsp } from 'fs';
import { Application } from 'express';
import request from 'supertest';
import sharp from 'sharp';
import { EImageRepoServiceError } from '../../../src/shared/repo/image-repo.service.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { IMAGE_CACHE_CONTROL } from '../../../src/modules/files/config.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

function imagesRoot(): string {
  const root = process.env.FILES_UPLOAD_PATH;
  if (!root) {
    throw new Error('FILES_UPLOAD_PATH is not set');
  }
  return path.join(root, 'images');
}

describe('Integration: GetImage (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Application;
  const TEST_IMAGE_PATH = path.join(process.cwd(), 'test/integration/_fixtures/test-img.jpg');

  beforeAll(async () => {
    await startInMemoryMongo();
    app = buildTestApp().app;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await clearDatabase();
    await fsp.rm(imagesRoot(), { recursive: true, force: true });
  });

  it('returns 401 without auth cookie', async () => {
    const res = await request(app).get('/api/files/image/image-unauth');

    expect(res.status).toBe(401);
  });

  it('returns 404 when the image is not in the database', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie).get('/api/files/image/missing-image');

    expect(res.status).toBe(404);
    expect(res.body.name).toBe(EImageRepoServiceError.UserImageNotFound);
    expect(res.body).toHaveProperty('message');
  });

  it('does not serve another user their neighbour image', async () => {
    const owner = await seedTestUser({ email: 'owner@example.com' });
    const stranger = await seedTestUser({ email: 'stranger@example.com' });
    const imageId = 'image-private';
    await uploadFixture(app, owner.jwtCookie, imageId, TEST_IMAGE_PATH);

    const res = await authenticatedRequest(app, stranger.jwtCookie).get(
      `/api/files/image/${imageId}`,
    );

    expect(res.status).toBe(404);
    expect(res.body.name).toBe(EImageRepoServiceError.UserImageNotFound);
  });

  it('streams the stored image with cache headers after a successful upload', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'image-get-1';
    await uploadFixture(app, jwtCookie, imageId, TEST_IMAGE_PATH);

    const res = await getImageBuffer(app, jwtCookie, imageId);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/webp');
    expect(res.headers['cache-control']).toBe(IMAGE_CACHE_CONTROL);
    expect(res.headers.etag).toBeTruthy();
    expect(Number(res.headers['content-length'])).toBe((res.body as Buffer).length);
    const meta = await sharp(res.body).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBeGreaterThan(0);
  });

  it('answers 304 when the client already has the same version', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'image-get-etag';
    await uploadFixture(app, jwtCookie, imageId, TEST_IMAGE_PATH);
    const first = await getImageBuffer(app, jwtCookie, imageId);
    const etag = first.headers.etag;
    if (typeof etag !== 'string') {
      throw new Error('expected an ETag header');
    }

    const res = await authenticatedRequest(app, jwtCookie)
      .get(`/api/files/image/${imageId}`)
      .set('If-None-Match', etag);

    expect(res.status).toBe(304);
    expect(res.headers.etag).toBe(etag);
  });

  it('resizes the image when width is requested', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'image-get-resize';
    await uploadFixture(app, jwtCookie, imageId, TEST_IMAGE_PATH);

    const original = await sharp(TEST_IMAGE_PATH).metadata();
    const requestedWidth = 40;
    const res = await getImageBuffer(app, jwtCookie, imageId, requestedWidth);

    expect(res.status).toBe(200);
    expect(res.headers['content-length']).toBeUndefined();
    const meta = await sharp(res.body).metadata();
    expect(meta.width).toBe(requestedWidth);
    expect(original.width).toBeGreaterThan(requestedWidth);
  });

  it('clamps a requested width to the store long edge', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'image-get-width-cap';
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
    await uploadFixture(app, jwtCookie, imageId, wide);

    const res = await getImageBuffer(app, jwtCookie, imageId, 4000);

    expect(res.status).toBe(200);
    const meta = await sharp(res.body).metadata();
    expect(meta.width).toBe(ImageConst.MAX_LONG_EDGE_PX);
    expect(meta.height).toBe(800);
  });

  it('returns 404 when the document exists but the file is gone', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'image-file-lost';
    await uploadFixture(app, jwtCookie, imageId, TEST_IMAGE_PATH);
    const document = await models.ImageModel.findOne({ imageId }).lean();
    if (!document) {
      throw new Error('expected persisted image');
    }
    await fsp.rm(path.join(imagesRoot(), document.fileId));

    const res = await authenticatedRequest(app, jwtCookie).get(`/api/files/image/${imageId}`);

    expect(res.status).toBe(404);
    expect(res.body.name).toBe(EGetImageUseCaseError.ImageFileMissing);
    expect(res.body).toHaveProperty('message');
  });

  it('refuses a persisted fileId that points outside the storage root', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const imageId = 'image-bad-file-id';
    await models.ImageModel.create({
      imageId,
      userId,
      storageType: 'local',
      fileId: '../../outside.webp',
      mimeType: 'image/webp',
    });

    const res = await authenticatedRequest(app, jwtCookie).get(`/api/files/image/${imageId}`);

    expect(res.status).toBe(500);
    expect(res.body.name).toBe(EGetImageUseCaseError.ImageReadFailed);
  });
});

async function uploadFixture(
  app: Application,
  jwtCookie: string,
  imageId: string,
  file: string | Buffer,
): Promise<void> {
  const res = await authenticatedRequest(app, jwtCookie)
    .post('/api/files/image')
    .field('imageId', imageId)
    .attach('file', file, { filename: 'fixture.jpg', contentType: 'image/jpeg' });

  if (res.status !== 200) {
    throw new Error(`Upload fixture failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
}

function getImageBuffer(
  app: Application,
  jwtCookie: string,
  imageId: string,
  width?: number,
): Promise<request.Response> {
  let req = authenticatedRequest(app, jwtCookie).get(`/api/files/image/${imageId}`);
  if (width !== undefined) {
    req = req.query({ width: String(width) });
  }
  return req.buffer(true).parse(collectBinary as never);
}

function collectBinary(
  res: { on: (event: string, listener: (chunk: Buffer) => void) => void },
  callback: (err: Error | null, body: Buffer) => void,
): void {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
}
