import { Application } from 'express';
import request from 'supertest';
import { TagDTO } from '@brainassistant/contracts';
import { ETagError } from '../../../src/shared/domain/models/tag.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

describe('Integration: CreateTag (Controller -> UseCase -> Repo -> MongoDB)', () => {
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
      .post('/api/sync/tag')
      .send({
        changeableObjectDto: {
          id: 'tag-unauth',
          name: 'Should not be created',
          color: 'teal',
          isCategory: false,
        },
      });

    expect(res.status).toBe(401);
  });

  it('happy path: should create a tag and persist it to DB', async () => {
    const { userId, jwtCookie } = await seedTestUser();

    const dto = {
      id: 'tag-123',
      name: 'Work',
      color: 'teal',
      isCategory: false,
    };

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/tag')
      .send({ changeableObjectDto: dto })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);

    const responseBody: TagDTO = res.body;
    expect(responseBody.id).toBe(dto.id);
    expect(responseBody.name).toBe(dto.name);
    expect(responseBody.color).toBe(dto.color);
    expect(responseBody.isCategory).toBe(false);
    expect(responseBody.userId).toBe(userId);
    expect(responseBody.createdAt).toBeDefined();
    expect(responseBody.modifiedAt).toBeDefined();

    const persisted = await models.TagModel.findById(dto.id).lean();
    expect(persisted).not.toBeNull();
    if (!persisted) {
      throw new Error('expected persisted tag');
    }
    expect(persisted.name).toBe(dto.name);
    expect(persisted.color).toBe(dto.color);
    expect(persisted.isCategory).toBe(false);
    expect(String(persisted.userId)).toBe(userId);
  });

  it('empty name -> 400 and error payload', async () => {
    const { jwtCookie } = await seedTestUser();

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/tag')
      .send({
        changeableObjectDto: {
          id: 'tag-empty-name',
          name: '',
          color: 'teal',
          isCategory: false,
        },
      })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.name).toBe(ETagError.NameMissed);
    expect(res.body).toHaveProperty('message');
    expect(await models.TagModel.findById('tag-empty-name').lean()).toBeNull();
  });
});
