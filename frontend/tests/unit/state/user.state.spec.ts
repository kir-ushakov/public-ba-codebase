import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Actions, ofActionDispatched, provideStore, Store } from '@ngxs/store';
import { firstValueFrom, of, throwError } from 'rxjs';
import { HomeAccountMenuAction } from 'src/app/mobile-app/components/screens/home-screen/home-account-menu/home-account-menu.actions';
import { LoginScreenAction } from 'src/app/mobile-app/components/screens/login-screen/login-screen.actions';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { GoogleOAuthConsentService } from 'src/app/shared/services/integrations/google-oauth-consent.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { AppAction } from 'src/app/shared/state/app.actions';
import { UserAction } from 'src/app/shared/state/user.actions';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

describe('UserState', () => {
  let store: Store;
  let actions$: Actions;
  let authService: { logout: jest.Mock; login: jest.Mock };
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
    authService = {
      logout: jest.fn().mockReturnValue(of(undefined)),
      login: jest.fn(),
    };
    googleOAuthConsentService = {
      openForceConsentScreen: jest.fn(),
      clearForceConsentAttempt: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideStore([UserState]),
        { provide: AuthService, useValue: authService },
        { provide: SlackService, useValue: {} },
        { provide: GoogleOAuthConsentService, useValue: googleOAuthConsentService },
      ],
    });

    store = TestBed.inject(Store);
    actions$ = TestBed.inject(Actions);
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

  it('settles the login screen after a password login request finishes', async () => {
    authService.login.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'unavailable' } })),
    );
    const settled: LoginScreenAction.LoginSettled[] = [];
    const failed: UserAction.AuthFailed[] = [];
    const settledSub = actions$
      .pipe(ofActionDispatched(LoginScreenAction.LoginSettled))
      .subscribe(action => settled.push(action));
    const failedSub = actions$
      .pipe(ofActionDispatched(UserAction.AuthFailed))
      .subscribe(action => failed.push(action));

    await firstValueFrom(store.dispatch(new LoginScreenAction.LoginUser('a@b.co', 'password1')));
    await new Promise<void>(resolve => queueMicrotask(resolve));
    settledSub.unsubscribe();
    failedSub.unsubscribe();

    expect(settled).toHaveLength(1);
    expect(failed).toHaveLength(0);
  });

  it('reports invalid credentials and settles the login screen', async () => {
    authService.login.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 401, error: { message: 'Invalid credentials' } }),
      ),
    );
    const settled: LoginScreenAction.LoginSettled[] = [];
    const failed: UserAction.AuthFailed[] = [];
    const settledSub = actions$
      .pipe(ofActionDispatched(LoginScreenAction.LoginSettled))
      .subscribe(action => settled.push(action));
    const failedSub = actions$
      .pipe(ofActionDispatched(UserAction.AuthFailed))
      .subscribe(action => failed.push(action));

    await firstValueFrom(store.dispatch(new LoginScreenAction.LoginUser('a@b.co', 'password1')));
    await new Promise<void>(resolve => queueMicrotask(resolve));
    settledSub.unsubscribe();
    failedSub.unsubscribe();

    expect(failed).toHaveLength(1);
    expect(failed[0].message).toBe('Invalid credentials');
    expect(settled).toHaveLength(1);
  });

  it('clears the session after home account menu sign out', async () => {
    await firstValueFrom(store.dispatch(new HomeAccountMenuAction.SignOut()));

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(store.selectSnapshot(UserState.isLoggedIn)).toBe(false);
  });
});
