import { Component } from '@angular/core';

@Component({
    selector: 'ba-sign-in-with-google-btn',
    templateUrl: './sign-in-with-google-btn.component.html',
    styleUrls: ['./sign-in-with-google-btn.component.scss']
})
export class SignInWithGoogleBtnComponent {
  readonly pathToConsentScreen = `/api/integrations/google/oauth-consent-screen?ngsw-bypass=1`;
}
