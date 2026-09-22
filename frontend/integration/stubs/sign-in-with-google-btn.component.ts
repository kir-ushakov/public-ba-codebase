import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserAction } from 'src/app/shared/state/user.actions';
import { User } from 'src/app/shared/models/user.model';

/**
 * Stub component for Playwright integration tests.
 * Replaces the real SignInWithGoogleBtnComponent during the integration build.
 */
@Component({
  selector: 'ba-sign-in-with-google-btn',
  template: '<button (click)="signIn()">Sign in with Google</button>',
})
export class SignInWithGoogleBtnComponent {
  constructor(private store: Store) {}

  signIn() {
    // Create fake user data for the integration suite
    const fakeUser: User = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      userId: 'fake-user-id',
      googleId: 'fake-google-id',
      googleRefreshToken: 'fake-refresh-token',
      googleAccessToken: 'fake-access-token',
    };

    // Dispatch action to update NgXS state
    this.store.dispatch(new UserAction.UserAuthenticatedWithGoogle(fakeUser));

    console.log('[E2E] Fake login applied with user state updated');

    // Redirect to home page
    window.location.href = '/';
  }
}
