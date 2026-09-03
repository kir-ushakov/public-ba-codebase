import passport from 'passport';
import { Strategy } from 'passport-strategy';
import type { Profile } from 'passport-google-oauth20';
import type { GoogleProfileWithTokens } from '../../../src/shared/infra/auth/google.strategy.js';

export type FakeGoogleOutcome =
  | { type: 'success'; value: GoogleProfileWithTokens }
  | { type: 'error'; error: Error };

/**
 * Passport strategy named `google` that never talks to Google.
 * Swap it in after createApp() so GoogleAuthUsecase still runs for real.
 */
export class FakeGoogleStrategy extends Strategy {
  name = 'google';

  constructor(private readonly outcome: FakeGoogleOutcome) {
    super();
  }

  authenticate(): void {
    if (this.outcome.type === 'error') {
      this.error(this.outcome.error);
      return;
    }
    this.success(this.outcome.value);
  }
}

export function installFakeGoogleStrategy(outcome: FakeGoogleOutcome): void {
  passport.unuse('google');
  passport.use(new FakeGoogleStrategy(outcome));
}

export function fakeGoogleSuccess(options?: {
  googleId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  accessToken?: string;
  refreshToken?: string | undefined;
}): GoogleProfileWithTokens {
  const email = options?.email ?? 'google.user@example.com';
  const profile = {
    id: options?.googleId ?? 'google-id-1',
    provider: 'google',
    displayName: `${options?.firstName ?? 'Google'} ${options?.lastName ?? 'User'}`,
    _json: {
      email,
      given_name: options?.firstName ?? 'Google',
      family_name: options?.lastName ?? 'User',
    },
  } as Profile;

  return {
    profile,
    tokens: {
      accessToken: options?.accessToken ?? 'google-access-token',
      refreshToken: options?.refreshToken === undefined ? 'google-refresh-token' : options.refreshToken,
    },
  };
}
