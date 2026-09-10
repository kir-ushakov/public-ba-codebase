import { Injectable } from '@angular/core';
import {
  GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY,
  GOOGLE_FORCE_CONSENT_COOLDOWN_MS,
  GOOGLE_OAUTH_FORCE_CONSENT_URL,
} from '../../constants/google-oauth.const';

@Injectable({
  providedIn: 'root',
})
export class GoogleOAuthConsentService {
  /** Opens Google consent with prompt=consent so a new refresh token can be issued. */
  openForceConsentScreen(): void {
    if (this.hasRecentForceConsentAttempt()) {
      return;
    }
    this.markForceConsentAttempt();
    window.location.assign(GOOGLE_OAUTH_FORCE_CONSENT_URL);
  }

  hasRecentForceConsentAttempt(): boolean {
    const storedTimestamp = sessionStorage.getItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY);
    // Missing, or the old boolean `'1'` from an earlier build — allow a new attempt.
    if (!storedTimestamp || storedTimestamp === '1') {
      return false;
    }
    const lastAttemptMs = Number(storedTimestamp);
    if (!Number.isFinite(lastAttemptMs)) {
      return false;
    }
    return Date.now() - lastAttemptMs < GOOGLE_FORCE_CONSENT_COOLDOWN_MS;
  }

  markForceConsentAttempt(): void {
    sessionStorage.setItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY, String(Date.now()));
  }

  /** After a new grant is stored, allow a later invalid-token redirect in this tab. */
  clearForceConsentAttempt(): void {
    sessionStorage.removeItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY);
  }
}
