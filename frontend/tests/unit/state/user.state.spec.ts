import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { GoogleOAuthConsentService } from 'src/app/shared/services/integrations/google-oauth-consent.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { AppAction } from 'src/app/shared/state/app.actions';
import { UserAction } from 'src/app/shared/state/user.actions';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

describe('UserState', () => {
  let store: Store;
  let googleOAuthConsentService: {
    openForceConsentScreen: jest.Mock;
    clearForceConsentAttempt: jest.Mock;
  };

  const userData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    userId: 'user-1',
    googleId: 'g-1',
  };

  beforeEach(() => {
    googleOAuthConsentService = {
      openForceConsentScreen: jest.fn(),
      clearForceConsentAttempt: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideStore([UserState]),
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
        { provide: GoogleOAuthConsentService, useValue: googleOAuthConsentService },
      ],
    });

    store = TestBed.inject(Store);
    store.reset({
      user: {
        userData,
        authState: EUserAuthState.Authenticated,
        authType: undefined,
        integrations: { isAddedToSlack: undefined, googleNeedsReconsent: false },
      },
    });
  });

  it('flags Google reconsent once when the refresh token is invalid', async () => {
    await firstValueFrom(store.dispatch(new AppAction.GoogleRefreshTokenInvalid()));
    expect(store.selectSnapshot(UserState.needsGoogleReconsent)).toBe(true);
    expect(googleOAuthConsentService.openForceConsentScreen).toHaveBeenCalledTimes(1);

    await firstValueFrom(store.dispatch(new AppAction.GoogleRefreshTokenInvalid()));
    expect(store.selectSnapshot(UserState.needsGoogleReconsent)).toBe(true);
    expect(googleOAuthConsentService.openForceConsentScreen).toHaveBeenCalledTimes(2);
  });

  it('clears the reconsent flag after a successful Google login', async () => {
    await firstValueFrom(store.dispatch(new AppAction.GoogleRefreshTokenInvalid()));
    await firstValueFrom(store.dispatch(new UserAction.UserAuthenticatedWithGoogle(userData)));

    expect(store.selectSnapshot(UserState.needsGoogleReconsent)).toBe(false);
    expect(googleOAuthConsentService.clearForceConsentAttempt).toHaveBeenCalledTimes(1);
  });

  it('treats missing persisted reconsent flag as false', () => {
    store.reset({
      user: {
        userData,
        authState: EUserAuthState.Authenticated,
        authType: undefined,
        integrations: { isAddedToSlack: undefined },
      },
    });

    expect(store.selectSnapshot(UserState.needsGoogleReconsent)).toBe(false);
  });
});
