import {
  GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY,
  GOOGLE_FORCE_CONSENT_COOLDOWN_MS,
  GOOGLE_OAUTH_FORCE_CONSENT_URL,
} from 'src/app/shared/constants/google-oauth.const';
import { GoogleOAuthConsentService } from 'src/app/shared/services/integrations/google-oauth-consent.service';

describe('GoogleOAuthConsentService', () => {
  let service: GoogleOAuthConsentService;
  let assign: jest.Mock;
  let now: number;

  beforeEach(() => {
    sessionStorage.clear();
    assign = jest.fn();
    now = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign },
    });
    service = new GoogleOAuthConsentService();
  });

  afterEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('assigns the force-consent URL once within the cooldown', () => {
    service.openForceConsentScreen();
    service.openForceConsentScreen();

    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith(GOOGLE_OAUTH_FORCE_CONSENT_URL);
    expect(sessionStorage.getItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY)).toBe(String(now));
  });

  it('retries after the cooldown', () => {
    service.openForceConsentScreen();
    (Date.now as jest.Mock).mockReturnValue(now + GOOGLE_FORCE_CONSENT_COOLDOWN_MS + 1);
    service.openForceConsentScreen();

    expect(assign).toHaveBeenCalledTimes(2);
  });

  it('retries when the old boolean session flag is still set', () => {
    sessionStorage.setItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY, '1');
    service.openForceConsentScreen();

    expect(assign).toHaveBeenCalledTimes(1);
  });

  it('allows another redirect after a successful reconnect', () => {
    service.openForceConsentScreen();
    service.clearForceConsentAttempt();
    service.openForceConsentScreen();

    expect(assign).toHaveBeenCalledTimes(2);
    expect(sessionStorage.getItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY)).toBe(String(now));
  });
});
