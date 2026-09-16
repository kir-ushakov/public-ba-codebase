import { Application } from 'express';
import request from 'supertest';
import { TaskDTO, ETaskStatus, ETaskType, EApiError, TaskConst } from '@brainassistant/contracts';
import { ETaskError } from '../../../src/shared/domain/models/task.js';
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
          type: ETaskType.Basic,
          title: 'Should not be created',
          status: ETaskStatus.Todo,
        },
      });

    expect(res.status).toBe(401);
  });

  it('happy path: should create a task and persist it to DB', async () => {
    const { userId, jwtCookie } = await seedTestUser();

    const dto = {
      id: 'task-123',
      type: ETaskType.Basic,
      title: 'Integration Test Task',
      status: ETaskStatus.Todo,
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
    if (!persisted) {
      throw new Error('expected persisted task');
    }
    expect(persisted.title).toBe(dto.title);
    expect(persisted.imageId).toBe(dto.imageId);
    expect(String(persisted.userId)).toBe(userId);
  });

  it('retried create of the same id for the same user is idempotent', async () => {
    const { userId, jwtCookie } = await seedTestUser();

    const dto = {
      id: 'task-idempotent-1',
      type: ETaskType.Basic,
      title: 'Original create payload',
      status: ETaskStatus.Todo,
    };

    const first = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/task')
      .send({ changeableObjectDto: dto })
      .set('Accept', 'application/json');

    expect(first.status).toBe(201);

    const retryPayload = {
      ...dto,
      title: 'Should not overwrite the stored task',
    };

    const retry = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/task')
      .send({ changeableObjectDto: retryPayload })
      .set('Accept', 'application/json');

    expect(retry.status).toBe(201);
    expect(retry.body.id).toBe(dto.id);
    expect(retry.body.userId).toBe(userId);

    const matching = await models.TaskModel.find({ _id: dto.id }).lean();
    expect(matching).toHaveLength(1);
    expect(matching[0]?.title).toBe(dto.title);
  });

  it('create with an id that belongs to another user does not overwrite it', async () => {
    const owner = await seedTestUser({ email: 'owner@example.com' });
    const other = await seedTestUser({ email: 'other@example.com' });

    const dto = {
      id: 'task-id-conflict',
      type: ETaskType.Basic,
      title: 'Owned by the first user',
      status: ETaskStatus.Todo,
    };

    const created = await authenticatedRequest(app, owner.jwtCookie)
      .post('/api/sync/task')
      .send({ changeableObjectDto: dto })
      .set('Accept', 'application/json');

    expect(created.status).toBe(201);

    const conflict = await authenticatedRequest(app, other.jwtCookie)
      .post('/api/sync/task')
      .send({ changeableObjectDto: dto })
      .set('Accept', 'application/json');

    expect(conflict.status).toBe(500);
    expect(conflict.body.name).toBe(EApiError.Unexpected);

    const matching = await models.TaskModel.find({ _id: dto.id }).lean();
    expect(matching).toHaveLength(1);
    expect(String(matching[0]?.userId)).toBe(owner.userId);
  });

  it('invalid dto -> should return 400 and error payload', async () => {
    const { jwtCookie } = await seedTestUser();

    const badDto = {
      id: 'task-err-1',
      type: ETaskType.Basic,
      title: '',
      status: ETaskStatus.Todo,
    };

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/task')
      .send({ changeableObjectDto: badDto })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.name).toBe(ETaskError.TitleMissed);
    expect(res.body).toHaveProperty('message');
  });

  it('creates a task with a one-character title', async () => {
    const { userId, jwtCookie } = await seedTestUser();

    const dto = {
      id: 'task-one-char',
      type: ETaskType.Basic,
      title: 'A',
      status: ETaskStatus.Todo,
    };

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/task')
      .send({ changeableObjectDto: dto })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);

    const responseBody: TaskDTO = res.body;
    expect(responseBody.title).toBe('A');
    expect(responseBody.userId).toBe(userId);

    const persisted = await models.TaskModel.findById(dto.id).lean();
    expect(persisted).not.toBeNull();
    expect(persisted?.title).toBe('A');
  });

  it('title longer than 100 characters -> 400 TitleTooLong', async () => {
    const { jwtCookie } = await seedTestUser();

    const badDto = {
      id: 'task-title-too-long',
      type: ETaskType.Basic,
      title: 'a'.repeat(TaskConst.TITLE_MAX_LENGTH + 1),
      status: ETaskStatus.Todo,
    };

    const res = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/task')
      .send({ changeableObjectDto: badDto })
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.name).toBe(ETaskError.TitleTooLong);
    expect(res.body).toHaveProperty('message');
  });
});
