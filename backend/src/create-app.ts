import express, { Application } from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { apiRouters } from './shared/infra/http/api/index.js';
import UserModel from './shared/infra/database/mongodb/user.model.js';
import { googleStrategy, jwtStrategy } from './shared/infra/auth/index.js';

/**
 * Builds the Express app (middleware, Passport, routers) without connecting
 * to MongoDB or binding process-level error handlers. Tests import this;
 * production still goes through `app.ts` which also bootstraps the database.
 */
export function createApp(): Application {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  const secret = process.env.SESSION_SECRET;
  app.use(
    session({
      secret,
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use(cookieParser());

  if (process.env.AUTHENTICATION_STRATEGY === 'SESSION') {
    app.use(passport.initialize());
    app.use(passport.session());
    passport.serializeUser(UserModel.serializeUser());
    passport.deserializeUser(UserModel.deserializeUser());
  }

  if (process.env.AUTHENTICATION_STRATEGY === 'JWT') {
    app.use(passport.initialize());
    passport.use(jwtStrategy);
  }

  passport.use(UserModel.createStrategy());
  passport.use(googleStrategy);

  app.use('/', apiRouters);

  return app;
}
