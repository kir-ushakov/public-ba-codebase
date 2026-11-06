import path from 'path';
import { promises as fsp } from 'fs';
import { EDeleteImageUseCaseError } from '@brainassistant/contracts';
import { Application } from 'express';
import request from 'supertest';
import { localImageStorage } from '../../../src/modules/files/services/_index.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

describe('Integration: DeleteImage (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Application;

  beforeAll(async () => {
    await startInMemoryMongo();
    app = buildTestApp().app;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('returns 401 without auth cookie', async () => {
    const res = await request(app).delete('/api/files/image/aa-image-unauth');

    expect(res.status).toBe(401);
  });

  it('rejects an image id that is not a safe path segment', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie).delete('/api/files/image/not_safe');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      name: EDeleteImageUseCaseError.InvalidImageId,
    });
  });

  it('deletes a local image file and its document', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const imageId = 'aa-local-image';
    const fileId = await storeLocalImage(userId, imageId);

    const res = await authenticatedRequest(app, jwtCookie).delete(`/api/files/image/${imageId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ imageId });
    expect(await models.ImageModel.findOne({ userId, imageId }).lean()).toBeNull();
    await expectMissing(path.join(uploadRoot(), 'images', fileId));
  });

  it('returns 200 when the image is already gone', async () => {
    const { jwtCookie } = await seedTestUser();
    const imageId = 'aa-missing-img';

    const res = await authenticatedRequest(app, jwtCookie).delete(`/api/files/image/${imageId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ imageId });
  });

  it('leaves a Google Drive image document in place', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const imageId = 'aa-drive-image';
    await models.ImageModel.create({
      imageId,
      userId,
      storageType: 'googleDrive',
      fileId: 'drive-file-id',
      mimeType: 'image/jpeg',
    });

    const res = await authenticatedRequest(app, jwtCookie).delete(`/api/files/image/${imageId}`);

    expect(res.status).toBe(200);
    expect(await models.ImageModel.findOne({ userId, imageId }).lean()).toMatchObject({
      storageType: 'googleDrive',
      fileId: 'drive-file-id',
    });
  });
});

function uploadRoot(): string {
  const root = process.env.FILES_UPLOAD_PATH;
  if (!root) {
    throw new Error('FILES_UPLOAD_PATH is not set');
  }
  return root;
}

async function expectMissing(filePath: string): Promise<void> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path from the persisted test document
  await expect(fsp.stat(filePath)).rejects.toMatchObject({ code: 'ENOENT' });
}

async function storeLocalImage(userId: string, imageId: string): Promise<string> {
  const sourcePath = path.join(uploadRoot(), 'tmp', `${imageId}.webp`);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- per-worker test upload dir
  await fsp.writeFile(sourcePath, 'image');
  const stored = await localImageStorage.put({
    userId,
    imageId,
    sourcePath,
    extension: 'webp',
  });
  if (stored.isFailure) {
    throw new Error(stored.error.message);
  }
  const fileId = stored.getValue();
  await models.ImageModel.create({
    imageId,
    userId,
    storageType: 'local',
    fileId,
    mimeType: 'image/webp',
  });
  return fileId;
}
