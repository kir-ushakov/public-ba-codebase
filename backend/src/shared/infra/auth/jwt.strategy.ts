import { Strategy as JwtStrategy } from 'passport-jwt';
import UserModel from '../database/mongodb/user.model';

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

// custom extractor for ccokies
const cookieExtractor = function (req) {
  var token = null;
  if (req && req.cookies) {
    token = req.cookies['jwt'];
  }
  return token;
};

const opts = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET,
};

export const jwtStrategy = new JwtStrategy(opts, async function (
  jwtPayload: IJwtTokenPayload,
  done
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
