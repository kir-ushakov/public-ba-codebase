import jwt from 'jsonwebtoken';
import { Application } from 'express';
import request, { Test } from 'supertest';
import { LoginService } from '../../../src/modules/auth/services/login.service.js';
import UserModel from '../../../src/shared/infra/database/mongodb/user.model.js';

export type SeedTestUserOptions = {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
};

export type SeededTestUser = {
  userId: string;
  email: string;
  jwtCookie: string;
};

const DEFAULTS = {
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  password: 'password123',
};

/**
 * Creates a user in the current Mongo connection and returns a jwt cookie
 * matching LoginService.setJwtCookie (cookie name `jwt`, payload `{ user }`).
 */
export async function seedTestUser(
  options: SeedTestUserOptions = {},
): Promise<SeededTestUser> {
  const email = options.email ?? DEFAULTS.email;
  const firstName = options.firstName ?? DEFAULTS.firstName;
  const lastName = options.lastName ?? DEFAULTS.lastName;
  const password = options.password ?? DEFAULTS.password;

  const user = await UserModel.register(
    new UserModel({ username: email, firstName, lastName }),
    password,
  );
  const userId = user._id.toString();

  const token = jwt.sign(
    {
      user: {
        firstName,
        lastName,
        email,
        userId,
      },
    },
    process.env.JWT_SECRET,
    { expiresIn: LoginService.JWT_TTL_SECONDS },
  );

  return {
    userId,
    email,
    jwtCookie: `jwt=${token}`,
  };
}

export function authenticatedRequest(app: Application, jwtCookie: string): {
  get: (url: string) => Test;
  post: (url: string) => Test;
  patch: (url: string) => Test;
  delete: (url: string) => Test;
} {
  const cookie = jwtCookie.startsWith('jwt=') ? jwtCookie : `jwt=${jwtCookie}`;
  return {
    get: (url: string) => request(app).get(url).set('Cookie', cookie),
    post: (url: string) => request(app).post(url).set('Cookie', cookie),
    patch: (url: string) => request(app).patch(url).set('Cookie', cookie),
    delete: (url: string) => request(app).delete(url).set('Cookie', cookie),
  };
}
