import { Component } from '@angular/core';

@Component({
  selector: 'ba-sign-in-with-google-btn',
  templateUrl: './sign-in-with-google-btn.component.html',
  styleUrls: ['./sign-in-with-google-btn.component.scss'],
})
export class SignInWithGoogleBtnComponent {
  readonly pathToConsentScreen = `/api/integrations/google/oauth-consent-screen?ngsw-bypass=1`;
  private static readonly FORCE_CONSENT_ATTEMPT_KEY = 'google_force_consent_attempted';

  signIn() {
    // Start a fresh OAuth flow; do not keep stale retry state.
    sessionStorage.removeItem(SignInWithGoogleBtnComponent.FORCE_CONSENT_ATTEMPT_KEY);
    // Redirect to Google OAuth consent screen
    window.location.href = this.pathToConsentScreen;
  }
}
