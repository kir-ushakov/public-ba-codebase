import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';

export const googleStrategy = new GoogleStrategy(
  {
    /**
     * #NOTE:
     * You need to create a Project in Google Cloud Console
     * and add Web Cliebn ID to get
     * Client ID and Secret from the Google credentials page.
     *
     */
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    /**
     * #NOTE
     * The callback URL specifies the redirect path to the front-end page
     * that should process the Code retrieved from the Google API.
     */
    callbackURL: process.env.GOOGLE_OAUTH_CALLBACK,
  },
  /**
   * #NOTE
   * This callback function allow to handle the response from Google
   * and pass it through the Done function.
   */
  async function (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ) {
    try {
      if (profile) {
        return done(null, profile);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  }
);
