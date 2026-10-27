import express, { Application } from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { apiRouters } from './shared/infra/http/api/index.js';
import UserModel from './shared/infra/database/mongodb/user.model.js';
import { googleStrategy, jwtStrategy } from './shared/infra/auth/index.js';
import { unexpectedErrorHandler } from './shared/infra/http/utils/unexpected-error.middleware.js';
import { LoggerService } from './shared/services/logger/logger.service.js';

/**
 * Builds the Express app (middleware, Passport, routers) without connecting
 * to MongoDB or binding process-level error handlers. Tests import this;
 * production still goes through `app.ts` which also bootstraps the database.
 */
export function createApp(): Application {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(cookieParser());

  app.use(passport.initialize());
  passport.use(jwtStrategy);
  passport.use(UserModel.createStrategy());
  passport.use(googleStrategy);

  app.use('/', apiRouters);
  app.use(unexpectedErrorHandler(new LoggerService()));

  return app;
}
