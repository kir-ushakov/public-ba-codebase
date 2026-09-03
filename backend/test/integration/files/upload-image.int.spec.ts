import path from 'path';
import { promises as fsp } from 'fs';
import { Application } from 'express';
import request from 'supertest';
import { googleDriveService } from '../../../src/modules/integrations/google/services/index.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

describe('Integration: UploadImage (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Application;
  const TEST_IMAGE_PATH = path.join(process.cwd(), 'test/integration/_fixtures/test-img.jpg');
  const drive = googleDriveService as unknown as {
    uploadFile: jest.Mock;
  };

  beforeAll(async () => {
    await startInMemoryMongo();
    await fsp.mkdir(path.join(process.cwd(), 'test-uploads/tmp'), { recursive: true });
    app = buildTestApp().app;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
    await fsp.rm(path.join(process.cwd(), 'test-uploads'), { recursive: true, force: true });
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  it('returns 401 without auth cookie', async () => {
    const res = await request(app).post('/api/files/image').field('imageId', 'image-unauth');

    expect(res.status).toBe(401);
  });

  it('happy path: should upload image and persist metadata to DB', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const imageId = 'image-123';
    const mockGoogleDriveFileId = 'google-drive-file-id-abc';

    drive.uploadFile.mockResolvedValue(mockGoogleDriveFileId);

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/files/image')
      .field('imageId', imageId)
      .attach('file', TEST_IMAGE_PATH)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(drive.uploadFile).toHaveBeenCalledTimes(1);

    const persistedImage = await models.ImageModel.findOne({ imageId }).lean();
    expect(persistedImage).toMatchObject({
      imageId,
      fileId: mockGoogleDriveFileId,
      userId,
      storageType: 'googleDrive',
    });
  });

  it('should reject unsupported file types', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'image-invalid';
    const invalidFilePath = path.join(process.cwd(), 'test-uploads/tmp/test-file.txt');
    await fsp.writeFile(invalidFilePath, 'This is a text file');

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/files/image')
      .field('imageId', imageId)
      .attach('file', invalidFilePath)
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');

    const persistedImage = await models.ImageModel.findOne({ imageId }).lean();
    expect(persistedImage).toBeNull();
  });

  it('should handle Google Drive upload failures', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'image-error';

    drive.uploadFile.mockRejectedValue(new Error('Google Drive API error'));

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/files/image')
      .field('imageId', imageId)
      .attach('file', TEST_IMAGE_PATH)
      .set('Accept', 'application/json');

    expect(res.status).toBe(502);
    expect(res.body).toHaveProperty('message');

    const persistedImage = await models.ImageModel.findOne({ imageId }).lean();
    expect(persistedImage).toBeNull();
  });
});
