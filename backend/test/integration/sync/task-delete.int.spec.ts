import path from 'path';
import { promises as fsp } from 'fs';
import { Application } from 'express';
import request from 'supertest';
import { EActionType } from '../../../src/shared/infra/database/mongodb/action.model.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import {
  localAudioStorage,
  localImageStorage,
} from '../../../src/modules/files/services/_index.js';
import { buildImageRelativePath } from '../../../src/modules/files/services/image-storage/image-storage-path.function.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';
import { createTaskViaApi } from '../_setup/sync.helper.js';

describe('Integration: DeleteTask (Controller -> UseCase -> Repo -> MongoDB)', () => {
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
    const res = await request(app).delete('/api/sync/task/task-unauth');

    expect(res.status).toBe(401);
  });

  it('happy path: deletes the task and records a TaskDeleted action', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-delete-1',
      title: 'Task to delete now',
    });

    const res = await authenticatedRequest(app, jwtCookie).delete(`/api/sync/task/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
    expect(await models.TaskModel.findById(created.id).lean()).toBeNull();

    const action = await models.ActionModel.findOne({
      userId,
      entityId: created.id,
      type: EActionType.TaskDeleted,
    }).lean();
    expect(action).toMatchObject({
      userId,
      entityId: created.id,
      type: EActionType.TaskDeleted,
    });
    if (!action) {
      throw new Error('expected delete action');
    }
    expect(action.occurredAt).toBeInstanceOf(Date);
  });

  it('deletes local image files, image documents, and audio files with the task', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-with-files',
      title: 'Task with files',
    });
    const coverId = 'aa-cover-image';
    const galleryId = 'aa-gallery-image';
    const driveId = 'aa-drive-image';
    const otherId = 'aa-other-image';
    const audioId = 'aa-audio-clip1';

    const coverFileId = await storeLocalImage(userId, coverId);
    const galleryFileId = await storeLocalImage(userId, galleryId);
    const otherFileId = await storeLocalImage(userId, otherId);
    await storeAudio(userId, audioId);
    await models.ImageModel.create({
      imageId: driveId,
      userId,
      storageType: 'googleDrive',
      fileId: 'drive-file-id',
      mimeType: 'image/jpeg',
    });
    await models.TaskModel.updateOne(
      { _id: created.id },
      {
        $set: {
          imageId: coverId,
          images: [galleryId, driveId],
          audioAttachments: [
            {
              id: audioId,
              durationMs: 1000,
              mimeType: 'audio/webm',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      },
    );

    const res = await authenticatedRequest(app, jwtCookie).delete(`/api/sync/task/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({});
    expect(await models.TaskModel.findById(created.id).lean()).toBeNull();
    expect(await models.ImageModel.findOne({ userId, imageId: coverId }).lean()).toBeNull();
    expect(await models.ImageModel.findOne({ userId, imageId: galleryId }).lean()).toBeNull();
    expect(await models.ImageModel.findOne({ userId, imageId: driveId }).lean()).toMatchObject({
      storageType: 'googleDrive',
      fileId: 'drive-file-id',
    });
    expect(await models.ImageModel.findOne({ userId, imageId: otherId }).lean()).toMatchObject({
      fileId: otherFileId,
    });
    await expectMissing(storedImagePath(coverFileId));
    await expectMissing(storedImagePath(galleryFileId));
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path from the persisted test document
    await expect(fsp.stat(storedImagePath(otherFileId))).resolves.toBeDefined();
    const audioDir = path.join(uploadRoot(), 'audio', userId, audioId.slice(0, 2).toLowerCase());
    await expectMissing(path.join(audioDir, `${audioId}.webm`));
    await expectMissing(path.join(audioDir, `${audioId}.meta.json`));
    expect(
      await models.ActionModel.findOne({
        userId,
        entityId: created.id,
        type: EActionType.TaskDeleted,
      }).lean(),
    ).toMatchObject({ entityId: created.id });
  });

  it('deletes the task when attachment files are already missing', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const created = await createTaskViaApi(app, jwtCookie, {
      id: 'task-missing-files',
      title: 'Task with missing files',
    });
    const imageId = 'bb-missing-img1';
    const audioId = 'bb-missing-aud1';
    const fileId = buildImageRelativePath(userId, imageId, 'webp');
    if (!fileId) {
      throw new Error('expected a storage path for the missing image');
    }
    await models.ImageModel.create({
      imageId,
      userId,
      storageType: 'local',
      fileId,
      mimeType: 'image/webp',
    });
    await models.TaskModel.updateOne(
      { _id: created.id },
      {
        $set: {
          imageId,
          audioAttachments: [
            {
              id: audioId,
              durationMs: 500,
              mimeType: 'audio/webm',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      },
    );

    const res = await authenticatedRequest(app, jwtCookie).delete(`/api/sync/task/${created.id}`);

    expect(res.status).toBe(200);
    expect(await models.TaskModel.findById(created.id).lean()).toBeNull();
    expect(await models.ImageModel.findOne({ userId, imageId }).lean()).toBeNull();
    expect(
      await models.ActionModel.countDocuments({
        userId,
        entityId: created.id,
        type: EActionType.TaskDeleted,
      }),
    ).toBe(1);
  });

  it('is idempotent: deleting a missing task still returns 200 and writes no action', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie).delete(
      '/api/sync/task/task-already-gone',
    );

    expect(res.status).toBe(200);
    expect(await models.ActionModel.countDocuments()).toBe(0);
  });
});

function storedImagePath(fileId: string): string {
  return path.join(uploadRoot(), 'images', fileId);
}

async function expectMissing(filePath: string): Promise<void> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path from the persisted test document
  await expect(fsp.stat(filePath)).rejects.toMatchObject({ code: 'ENOENT' });
}

function uploadRoot(): string {
  const root = process.env.FILES_UPLOAD_PATH;
  if (!root) {
    throw new Error('FILES_UPLOAD_PATH is not set');
  }
  return root;
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

async function storeAudio(userId: string, audioId: string): Promise<void> {
  const sourcePath = path.join(uploadRoot(), 'tmp', `${audioId}.webm`);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- per-worker test upload dir
  await fsp.writeFile(sourcePath, 'audio');
  const stored = await localAudioStorage.put({
    userId,
    audioId,
    sourcePath,
    mimeType: 'audio/webm',
  });
  if (stored.isFailure) {
    throw new Error(stored.error.message);
  }
}
