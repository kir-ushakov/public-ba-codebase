import { Strategy as JwtStrategy } from 'passport-jwt';
import type { Request } from 'express';
import UserModel from '../database/mongodb/user.model.js';

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
  secretOrKey: process.env.JWT_SECRET,
};

export const jwtStrategy = new JwtStrategy(opts, async function (
  jwtPayload: IJwtTokenPayload,
  done,
) {
  try {
    const user = await UserModel.findOne({ _id: jwtPayload.user.userId });
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err) {
    return done(err, false);
  }
});
