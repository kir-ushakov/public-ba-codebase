import { Component } from '@angular/core';
import { GOOGLE_OAUTH_CONSENT_URL } from 'src/app/shared/constants/google-oauth.const';

@Component({
  selector: 'ba-sign-in-with-google-btn',
  templateUrl: './sign-in-with-google-btn.component.html',
  styleUrls: ['./sign-in-with-google-btn.component.scss'],
})
export class SignInWithGoogleBtnComponent {
  signIn(): void {
    window.location.href = GOOGLE_OAUTH_CONSENT_URL;
  }
}
