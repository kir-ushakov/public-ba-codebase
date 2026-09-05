import { Application } from 'express';
import request from 'supertest';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';

describe('Integration: SignUp (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Application;

  const validSignup = {
    email: 'new.user@example.com',
    firstName: 'New',
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

  it('happy path: creates an unverified user and does not send email', async () => {
    const res = await request(app).post('/api/auth/signup').send(validSignup);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: validSignup.email,
      firstName: validSignup.firstName,
      lastName: validSignup.lastName,
    });

    const persisted = await models.UserModel.findOne({ username: validSignup.email }).lean();
    expect(persisted).toMatchObject({
      username: validSignup.email,
      firstName: validSignup.firstName,
      lastName: validSignup.lastName,
      verified: false,
    });
  });

  it('invalid email -> 400 and no user persisted', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        ...validSignup,
        email: 'not-an-email',
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
    expect(await models.UserModel.countDocuments()).toBe(0);
  });

  it('duplicate email -> 409', async () => {
    await request(app).post('/api/auth/signup').send(validSignup);

    const res = await request(app).post('/api/auth/signup').send(validSignup);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('message');
    expect(await models.UserModel.countDocuments()).toBe(1);
  });
});
