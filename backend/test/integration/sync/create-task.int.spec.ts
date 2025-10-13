import request from 'supertest';
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from '../_setup/mongo-memory.js';
import { buildTestApp } from './test-app.js';
import { CreateTaskResponseDTO } from '../../../src/modules/sync/usecases/task/create/create-task.dto.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';

describe('Integration: CreateTask (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: any;

  beforeAll(async () => {
    await startInMemoryMongo();
    // Build the express app wired to the controller
    const built = buildTestApp();
    app = built.app;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    // clear DB between tests
    await clearDatabase();
  });

  it('happy path: should create a task and persist it to DB', async () => {
    const dto = {
      id: 'task-123',
      type: 'TASK',
      title: 'Integration Test Task',
      status: 'OPEN',
      imageId: 'image-456', // imageId optional
    };

    const payload = {
      changeableObjectDto: dto,
    };

    const res = await request(app)
      .post('/api/tasks')
      .send(payload)
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    
    // Controller now returns clean DTO via TaskMapper.toDTO()
    const responseBody: CreateTaskResponseDTO = res.body;
    expect(responseBody).toBeDefined();
    expect(responseBody.id).toBeTruthy();
    expect(responseBody.title).toBe(dto.title);
    expect(responseBody.type).toBe(dto.type);
    expect(responseBody.status).toBe(dto.status);
    expect(responseBody.imageId).toBe(dto.imageId);
    expect(responseBody.userId).toBe('test-user-1');
    expect(responseBody.createdAt).toBeDefined();
    expect(responseBody.modifiedAt).toBeDefined();

    // Validate persisted in DB using TaskModel
    // Your TaskModel uses string _id; we used 'task-123'
    const persisted = await models.TaskModel.findById(dto.id).lean();
    expect(persisted).not.toBeNull();
    expect(persisted.title).toBe(dto.title);
    expect(persisted.imageId).toBe(dto.imageId);
    expect(persisted.userId).toBe('test-user-1'); // from test auth middleware
  });

  it('invalid dto -> should return 400 and error payload', async () => {
   
    const badDto = {
      id: 'task-err-1',
      type: 'TASK',
      title: '', 
      status: 'OPEN',
    };

    const res = await request(app)
      .post('/api/tasks')
      .send({ changeableObjectDto: badDto })
      .set('Accept', 'application/json');

    // Debug: Log response for validation test
    console.log('Validation test - Status:', res.status);
    console.log('Validation test - Body:', JSON.stringify(res.body, null, 2));

    // Should fail validation and return 400
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
  });
});
