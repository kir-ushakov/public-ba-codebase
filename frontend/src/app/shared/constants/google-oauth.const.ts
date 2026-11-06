import { environment } from 'src/environments/environment';

const CONSENT_SCREEN_PATH = 'integrations/google/oauth-consent-screen';

/** Google sign-in. */
export const GOOGLE_OAUTH_CONSENT_URL = `${environment.baseUrl}${CONSENT_SCREEN_PATH}?ngsw-bypass=1`;
