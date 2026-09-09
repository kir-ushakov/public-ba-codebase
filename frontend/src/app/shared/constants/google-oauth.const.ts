import { environment } from 'src/environments/environment';

const CONSENT_SCREEN_PATH = 'integrations/google/oauth-consent-screen';

/** First-time Google sign-in. */
export const GOOGLE_OAUTH_CONSENT_URL = `${environment.baseUrl}${CONSENT_SCREEN_PATH}?ngsw-bypass=1`;

/** Re-consent so Google issues a new refresh token. */
export const GOOGLE_OAUTH_FORCE_CONSENT_URL = `${environment.baseUrl}${CONSENT_SCREEN_PATH}?forceConsent=1&ngsw-bypass=1`;

/** Session flag that stops an automatic consent-retry loop. */
export const GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY = 'google_force_consent_attempted';
