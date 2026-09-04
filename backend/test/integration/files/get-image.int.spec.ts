import path from 'path';
import { createReadStream } from 'fs';
import { Application } from 'express';
import request from 'supertest';
import sharp from 'sharp';
import { googleDriveService } from '../../../src/modules/integrations/google/services/index.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

describe('Integration: GetImage (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Application;
  const TEST_IMAGE_PATH = path.join(process.cwd(), 'test/integration/_fixtures/test-img.jpg');
  const drive = googleDriveService as unknown as {
    uploadFile: jest.Mock;
    getImageById: jest.Mock;
  };

  beforeAll(async () => {
    await startInMemoryMongo();
    app = buildTestApp().app;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
    drive.uploadFile.mockResolvedValue('google-drive-file-id');
    drive.getImageById.mockImplementation(async () => ({
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed test fixture path
      data: createReadStream(TEST_IMAGE_PATH),
      headers: { 'content-type': 'image/jpeg' },
      status: 200,
      statusText: 'OK',
      config: {},
    }));
  });

  it('returns 401 without auth cookie', async () => {
    const res = await request(app).get('/api/files/image/image-unauth');

    expect(res.status).toBe(401);
  });

  it('returns 404 when the image is not in the database', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie).get('/api/files/image/missing-image');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
    expect(drive.getImageById).not.toHaveBeenCalled();
  });

  it('streams the image from Drive after a successful upload', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'image-get-1';
    await uploadFixture(app, jwtCookie, imageId);

    const res = await getImageBuffer(app, jwtCookie, imageId);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image\/jpeg/);
    expect(drive.getImageById).toHaveBeenCalledTimes(1);
    const meta = await sharp(res.body).metadata();
    expect(meta.format).toBe('jpeg');
    expect(meta.width).toBeGreaterThan(0);
  });

  it('resizes the image when width is requested', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'image-get-resize';
    await uploadFixture(app, jwtCookie, imageId);

    const original = await sharp(TEST_IMAGE_PATH).metadata();
    const requestedWidth = 40;
    const res = await getImageBuffer(app, jwtCookie, imageId, requestedWidth);

    expect(res.status).toBe(200);
    const meta = await sharp(res.body).metadata();
    expect(meta.width).toBe(requestedWidth);
    expect(original.width).toBeGreaterThan(requestedWidth);
  });
});

async function uploadFixture(app: Application, jwtCookie: string, imageId: string): Promise<void> {
  const TEST_IMAGE_PATH = path.join(process.cwd(), 'test/integration/_fixtures/test-img.jpg');
  const res = await authenticatedRequest(app, jwtCookie)
    .post('/api/files/image')
    .field('imageId', imageId)
    .attach('file', TEST_IMAGE_PATH);

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
