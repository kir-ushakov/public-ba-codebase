import { Types } from 'mongoose';
import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt';
import type { Request } from 'express';
import UserModel, { UserDocument } from '../database/mongodb/user.model.js';
import RefreshSessionModel from '../database/mongodb/refresh-session.model.js';
import { requiredEnv } from '../../../config/index.js';

type JwtAccessPayload = {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
  };
  sid?: string;
  iat?: number;
  exp?: number;
};

type AccessSession = {
  userId: string;
  expiresAt: Date;
  consumedAt?: Date | null;
};

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
  jwtPayload: JwtAccessPayload,
  done: VerifiedCallback,
): void {
  void loadAccessUser(jwtPayload)
    .then(user => {
      done(null, user ?? false);
    })
    .catch((err: unknown) => {
      done(err, false);
    });
});

async function loadAccessUser(jwtPayload: JwtAccessPayload): Promise<UserDocument | null> {
  const userId = jwtPayload.user?.userId;
  if (!jwtPayload.sid || !userId || !Types.ObjectId.isValid(jwtPayload.sid)) {
    return null;
  }

  const user = await UserModel.findOne({ _id: userId }).exec();
  if (!user) {
    return null;
  }

  const session = await RefreshSessionModel.findById(jwtPayload.sid).lean<AccessSession>().exec();
  if (!isLiveAccessSession(session, userId)) {
    return null;
  }
  return user;
}

function isLiveAccessSession(session: AccessSession | null, userId: string): boolean {
  if (!session || session.consumedAt) {
    return false;
  }
  if (session.expiresAt.getTime() <= Date.now()) {
    return false;
  }
  return session.userId === userId;
}
