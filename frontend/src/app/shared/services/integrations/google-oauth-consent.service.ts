import { Injectable } from '@angular/core';
import {
  GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY,
  GOOGLE_OAUTH_FORCE_CONSENT_URL,
} from '../../constants/google-oauth.const';

@Injectable({
  providedIn: 'root',
})
export class GoogleOAuthConsentService {
  /** Opens Google consent with prompt=consent so a new refresh token can be issued. */
  openForceConsentScreen(): void {
    if (sessionStorage.getItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY) === '1') {
      return;
    }
    sessionStorage.setItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY, '1');
    window.location.assign(GOOGLE_OAUTH_FORCE_CONSENT_URL);
  }

  /** After a new grant is stored, allow a later invalid-token redirect in this tab. */
  clearForceConsentAttempt(): void {
    sessionStorage.removeItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY);
  }
}
