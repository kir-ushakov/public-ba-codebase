import {
  GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY,
  GOOGLE_OAUTH_FORCE_CONSENT_URL,
} from 'src/app/shared/constants/google-oauth.const';
import { GoogleOAuthConsentService } from 'src/app/shared/services/integrations/google-oauth-consent.service';

describe('GoogleOAuthConsentService', () => {
  let service: GoogleOAuthConsentService;
  let assign: jest.Mock;

  beforeEach(() => {
    sessionStorage.clear();
    assign = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign },
    });
    service = new GoogleOAuthConsentService();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('assigns the force-consent URL once per session', () => {
    service.openForceConsentScreen();
    service.openForceConsentScreen();

    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith(GOOGLE_OAUTH_FORCE_CONSENT_URL);
    expect(sessionStorage.getItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY)).toBe('1');
  });

  it('allows another redirect after a successful reconnect', () => {
    service.openForceConsentScreen();
    service.clearForceConsentAttempt();
    service.openForceConsentScreen();

    expect(assign).toHaveBeenCalledTimes(2);
    expect(sessionStorage.getItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY)).toBe('1');
  });
});
