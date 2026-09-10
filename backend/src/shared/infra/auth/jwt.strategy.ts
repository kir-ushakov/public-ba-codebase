import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt';
import type { Request } from 'express';
import UserModel from '../database/mongodb/user.model.js';
import { requiredEnv } from '../../../config/index.js';

interface IJwtTokenPayload {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
  };
  iat: number;
  exp: number;
}

/**
 * Custom extractor to get jwt from cookies
 **/
const cookieExtractor = function (req: Request): string | null {
  let token: string | null = null;
  if (req.cookies) {
    token = req.cookies.jwt;
  }
  return token;
};

const opts = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: requiredEnv('JWT_SECRET'),
};

export const jwtStrategy = new JwtStrategy(opts, function (
  jwtPayload: IJwtTokenPayload,
  done: VerifiedCallback,
): void {
  void UserModel.findOne({ _id: jwtPayload.user.userId })
    .then(user => {
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    })
    .catch((err: unknown) => {
      done(err, false);
    });
});
