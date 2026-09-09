import { Component } from '@angular/core';
import {
  GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY,
  GOOGLE_OAUTH_CONSENT_URL,
} from 'src/app/shared/constants/google-oauth.const';

@Component({
  selector: 'ba-sign-in-with-google-btn',
  templateUrl: './sign-in-with-google-btn.component.html',
  styleUrls: ['./sign-in-with-google-btn.component.scss'],
})
export class SignInWithGoogleBtnComponent {
  signIn(): void {
    sessionStorage.removeItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY);
    window.location.href = GOOGLE_OAUTH_CONSENT_URL;
  }
}
