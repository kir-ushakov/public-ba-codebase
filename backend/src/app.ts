import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { apiRouters } from './shared/infra/http/api/index.js';
import * as loaders from './loaders/index.js';
import UserModel from './shared/infra/database/mongodb/user.model.js';
import { googleStrategy, jwtStrategy } from './shared/infra/auth/index.js';
import cors from 'cors';
import session from 'express-session';

export const app = express();

app.use(cors());

// parse incoming request bodies as JSON
app.use(express.json());

const secret = process.env.SESSION_SECRET;
const expressSession = session({
  secret,
  resave: false,
  saveUninitialized: false,
});

loaders.bootstrap('Node Backend App');

app.use(expressSession);

app.use(cookieParser());

if (process.env.AUTHENTICATION_STRATEGY === 'SESSION') {
  app.use(passport.initialize());
  app.use(passport.session());
  // serialize User to session
  passport.serializeUser(UserModel.serializeUser());
  // deserialize User from session
  passport.deserializeUser(UserModel.deserializeUser());
}

if (process.env.AUTHENTICATION_STRATEGY === 'JWT') {
  // set 'jwt' strategy to parse cookies and obtain User from JWT
  passport.use(jwtStrategy);
}

// set 'local' strategy for username/password authentication
passport.use(UserModel.createStrategy());

// set 'google' strategy for Google OAuth2.0 Provider API
passport.use(googleStrategy);

app.use('/', apiRouters);

process.on('uncaughtException', function (error) {
  // TODO: use special log here
  console.log(' ===== Uncaught Exception Occurred ===== ');
  console.log(error);
  process.exit(1);
});

process.on('unhandledRejection', function (reason, p) {
  // TODO: use special log here
  console.log(' ===== Unhandled Rejection Occurred ===== ');
  console.log(reason);
  process.exit(1);
});
