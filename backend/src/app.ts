import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import { apiRouters } from './shared/infra/http/api';
import * as loaders from './loaders';
import UserModel from './shared/infra/database/mongodb/user.model';
import { googleStrategy, jwtStrategy } from './shared/infra/auth/';

export const app = express();

const cors = require('cors');
app.use(cors());

// parse incoming request bodies as JSON
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

if (process.env.AUTHENTICATION_STRATEGY === 'SESSION') {
  app.use(passport.initialize());
  app.use(passport.session());
  passport.serializeUser(UserModel.serializeUser());
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
