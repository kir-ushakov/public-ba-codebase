import { Application } from 'express';
import request from 'supertest';
import { ETagError, ETagRepoServiceError, TagDTO } from '@brainassistant/contracts';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

describe('Integration: UpdateTag (Controller -> UseCase -> Repo -> MongoDB)', () => {
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
    const res = await request(app)
      .patch('/api/sync/tag')
      .send({
        changeableObjectDto: {
          id: 'tag-unauth',
          name: 'Work',
          color: 'teal',
          isPinned: true,
        },
      });

    expect(res.status).toBe(401);
  });

  it('pins a tag and leaves it unpinned when the field is omitted', async () => {
    const { userId, jwtCookie } = await seedTestUser();
    const created = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/tag')
      .send({
        changeableObjectDto: {
          id: 'tag-pin',
          name: 'Work',
          color: 'teal',
          createdAt: '2020-05-01T10:00:00.000Z',
          modifiedAt: '2020-05-01T10:05:00.000Z',
        },
      });
    expect(created.status).toBe(201);

    const pinned = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/tag')
      .send({
        changeableObjectDto: {
          id: 'tag-pin',
          name: 'Work',
          color: 'teal',
          isPinned: true,
          createdAt: '2020-05-01T10:00:00.000Z',
          modifiedAt: '2020-05-02T10:00:00.000Z',
        },
      })
      .set('Accept', 'application/json');

    expect(pinned.status).toBe(200);
    const pinnedBody: TagDTO = pinned.body;
    expect(pinnedBody).toMatchObject({
      id: 'tag-pin',
      userId,
      name: 'Work',
      color: 'teal',
      isPinned: true,
      createdAt: '2020-05-01T10:00:00.000Z',
      modifiedAt: '2020-05-02T10:00:00.000Z',
    });

    const pinnedDoc = await models.TagModel.findById('tag-pin').lean();
    expect(pinnedDoc?.isPinned).toBe(true);
    expect(typeof pinnedDoc?.syncRevision).toBe('number');

    const unpinned = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/tag')
      .send({
        changeableObjectDto: {
          id: 'tag-pin',
          name: 'Work',
          color: 'teal',
          createdAt: '2020-05-01T10:00:00.000Z',
          modifiedAt: '2020-05-03T10:00:00.000Z',
        },
      })
      .set('Accept', 'application/json');

    expect(unpinned.status).toBe(200);
    const unpinnedBody: TagDTO = unpinned.body;
    expect(unpinnedBody.isPinned).toBe(false);
    const unpinnedDoc = await models.TagModel.findById('tag-pin').lean();
    expect(unpinnedDoc?.isPinned).toBe(false);
  });

  it('returns 404 when the tag belongs to another user', async () => {
    const { jwtCookie } = await seedTestUser();
    await models.TagModel.collection.insertOne({
      _id: 'tag-other',
      userId: 'someone-else',
      name: 'Secret',
      color: 'teal',
      createdAt: new Date('2020-05-01T10:00:00.000Z'),
      modifiedAt: new Date('2020-05-01T10:00:00.000Z'),
    } as never);

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/tag')
      .send({
        changeableObjectDto: {
          id: 'tag-other',
          name: 'Secret',
          color: 'teal',
          isPinned: true,
          createdAt: '2020-05-01T10:00:00.000Z',
          modifiedAt: '2020-05-02T10:00:00.000Z',
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(404);
    expect(res.body.name).toBe(ETagRepoServiceError.UserTagNotFound);
    expect(res.body).toHaveProperty('message');
    const persisted = await models.TagModel.findById('tag-other').lean();
    expect(persisted?.isPinned).toBeUndefined();
  });

  it('empty name -> 400 and the stored tag is unchanged', async () => {
    const { jwtCookie } = await seedTestUser();
    await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/tag')
      .send({
        changeableObjectDto: {
          id: 'tag-empty',
          name: 'Work',
          color: 'teal',
          createdAt: '2020-05-01T10:00:00.000Z',
          modifiedAt: '2020-05-01T10:05:00.000Z',
        },
      });

    const res = await authenticatedRequest(app, jwtCookie)
      .patch('/api/sync/tag')
      .send({
        changeableObjectDto: {
          id: 'tag-empty',
          name: '',
          color: 'teal',
          isPinned: true,
          createdAt: '2020-05-01T10:00:00.000Z',
          modifiedAt: '2020-05-02T10:00:00.000Z',
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.name).toBe(ETagError.NameMissed);
    expect(res.body).toHaveProperty('message');
    const persisted = await models.TagModel.findById('tag-empty').lean();
    expect(persisted?.name).toBe('Work');
    expect(persisted?.isPinned).toBe(false);
  });
});
