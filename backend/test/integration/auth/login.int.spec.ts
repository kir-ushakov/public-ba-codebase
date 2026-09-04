import { Application } from 'express';
import request from 'supertest';
import { TaskDTO, ETaskStatus, ETaskType } from '@brainassistant/contracts';
import UserModel from '../../../src/shared/infra/database/mongodb/user.model.js';
import {
  authenticatedRequest,
  jwtCookieFromResponse,
} from '../_setup/auth.helper.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

describe('Integration: Login (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Application;

  const signupBody = {
    email: 'login.user@example.com',
    firstName: 'Login',
    lastName: 'User',
    password: 'password123',
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
  });

  it('rejects login when the account is not verified', async () => {
    await request(app).post('/api/auth/signup').send(signupBody);

    const res = await request(app).post('/api/auth/login').send({
      username: signupBody.email,
      password: signupBody.password,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('name');
    expect(res.body.message).toBe('User account not verified!');
  });

  it('rejects login with a wrong password', async () => {
    await request(app).post('/api/auth/signup').send(signupBody);
    await UserModel.updateOne({ username: signupBody.email }, { $set: { verified: true } });

    const res = await request(app).post('/api/auth/login').send({
      username: signupBody.email,
      password: 'wrong-password',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('name');
    expect(res.body.message).toBe('Authorization failed!');
  });

  it('happy path: sets a jwt cookie that can call a protected route', async () => {
    await request(app).post('/api/auth/signup').send(signupBody);
    await UserModel.updateOne({ username: signupBody.email }, { $set: { verified: true } });

    const res = await request(app).post('/api/auth/login').send({
      username: signupBody.email,
      password: signupBody.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: signupBody.email,
      firstName: signupBody.firstName,
      lastName: signupBody.lastName,
    });
    expect(res.body.user.userId).toBeTruthy();

    const jwtCookie = jwtCookieFromResponse(res);
    const taskRes = await authenticatedRequest(app, jwtCookie)
      .post('/api/sync/task')
      .send({
        changeableObjectDto: {
          id: 'task-from-login',
          type: ETaskType.Basic,
          title: 'Created after login',
          status: ETaskStatus.Todo,
        },
      })
      .set('Accept', 'application/json');

    expect(taskRes.status).toBe(201);
    const task: TaskDTO = taskRes.body;
    expect(task.userId).toBe(res.body.user.userId);
  });
});
