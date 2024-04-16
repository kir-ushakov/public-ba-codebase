import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { apiRouters } from './shared/infra/http/api';
import * as loaders from './loaders';
import UserModel from './shared/infra/database/mongodb/user.model';
import { googleStrategy, jwtStrategy } from './shared/infra/auth/';

const cors = require('cors');

export const app = express();
app.use(cors());
app.use(express.json());

const secret = process.env.SESSION_SECRET;
const expressSession = require('express-session')({
  secret,
  resave: false,
  saveUninitialized: false,
});

loaders.bootstrap('Node Backend App');

app.use(expressSession);

app.use(cookieParser());

passport.use(UserModel.createStrategy());
/**
 * #NOTE
 * Attached the Google strategy.
 * This middleware provides an abstraction layer for interacting with the Google OAuth API.
 */
passport.use(googleStrategy);
/**
 * #NOTE
 * Support Session-based authentication
 */
if (process.env.AUTHENTICATION_STRATEGY === 'SESSION') {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser(UserModel.serializeUser());
  passport.deserializeUser(UserModel.deserializeUser());
}

/**
 * #NOTE
 * Support JWT authentication
 */
if (process.env.AUTHENTICATION_STRATEGY === 'JWT') {
  passport.use(jwtStrategy);
}

app.use('/', apiRouters);
