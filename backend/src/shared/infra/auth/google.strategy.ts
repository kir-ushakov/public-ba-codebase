import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';

export const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_OAUTH_CALLBACK,
  },
  async function (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) {
    try {
      if (profile) {
        const tokens = { accessToken, refreshToken };
        return done(null, { profile, tokens });
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  }
);

export type GoogleAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type GoogleProfileWithTokens = {
  profile: Profile;
  tokens: GoogleAuthTokens;
};
