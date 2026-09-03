import { Application } from 'express';
import request from 'supertest';
import { TaskDTO } from '@brainassistant/contracts';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { authenticatedRequest, seedTestUser } from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

describe('Integration: CreateTask (Controller -> UseCase -> Repo -> MongoDB)', () => {
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
      .post('/api/sync/task')
      .send({
        changeableObjectDto: {
          id: 'task-unauth',
          type: 'TASK',
          title: 'Should not be created',
          status: 'OPEN',
        },
      });

    expect(res.status).toBe(401);
  });

  it('happy path: should create a task and persist it to DB', async () => {
    const { userId, jwtCookie } = await seedTestUser();

    const dto = {
      id: 'task-123',
      type: 'TASK',
      title: 'Integration Test Task',
      status: 'OPEN',
      imageId: 'image-456',
    };

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/task')
      .send({ changeableObjectDto: dto })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);

    const responseBody: TaskDTO = res.body;
    expect(responseBody).toBeDefined();
    expect(responseBody.id).toBe(dto.id);
    expect(responseBody.title).toBe(dto.title);
    expect(responseBody.type).toBe(dto.type);
    expect(responseBody.status).toBe(dto.status);
    expect(responseBody.imageId).toBe(dto.imageId);
    expect(responseBody.userId).toBe(userId);
    expect(responseBody.createdAt).toBeDefined();
    expect(responseBody.modifiedAt).toBeDefined();

    const persisted = await models.TaskModel.findById(dto.id).lean();
    expect(persisted).not.toBeNull();
    expect(persisted.title).toBe(dto.title);
    expect(persisted.imageId).toBe(dto.imageId);
    expect(String(persisted.userId)).toBe(userId);
  });

  it('invalid dto -> should return 400 and error payload', async () => {
    const { jwtCookie } = await seedTestUser();

    const badDto = {
      id: 'task-err-1',
      type: 'TASK',
      title: '',
      status: 'OPEN',
    };

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/task')
      .send({ changeableObjectDto: badDto })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
  });
});
