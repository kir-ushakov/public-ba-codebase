import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';

/** Passport payload — not a domain value object. Map to GoogleAuthTokens in the use-case. */
export type GoogleOAuthTokenPayload = {
  accessToken: string;
  refreshToken?: string;
};

export const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_OAUTH_CALLBACK,
  },
  function (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    try {
      if (profile) {
        const tokens: GoogleOAuthTokenPayload = { accessToken, refreshToken };
        done(null, { profile, tokens });
      } else {
        done(null, false);
      }
    } catch (err) {
      done(err, false);
    }
  },
);

export type GoogleProfileWithTokens = {
  profile: Profile;
  tokens: GoogleOAuthTokenPayload;
};
