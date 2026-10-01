import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { LoginScreenAction } from 'src/app/mobile-app/components/screens/login-screen/login-screen.actions';
import { LoginScreenState } from 'src/app/mobile-app/components/screens/login-screen/login-screen.state';
import { UserAction } from 'src/app/shared/state/user.actions';

describe('LoginScreenState', () => {
  let store: Store;

  const user = {
    firstName: 'Test',
    lastName: 'User',
    email: 'user@example.com',
    userId: 'user-1',
    googleId: 'g-1',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideStore([LoginScreenState])],
    });

    store = TestBed.inject(Store);
  });

  it('shows an auth error and clears it when the screen opens or the form changes', async () => {
    await firstValueFrom(store.dispatch(new UserAction.AuthFailed('Invalid credentials')));
    expect(store.selectSnapshot(LoginScreenState.authError)).toBe('Invalid credentials');

    await firstValueFrom(store.dispatch(LoginScreenAction.FieldValuesChanged));
    expect(store.selectSnapshot(LoginScreenState.authError)).toBeNull();

    await firstValueFrom(store.dispatch(new UserAction.AuthFailed('Invalid credentials')));
    await firstValueFrom(store.dispatch(LoginScreenAction.Opened));
    expect(store.selectSnapshot(LoginScreenState.authError)).toBeNull();
  });

  it('tracks password login as submitting until the request settles', async () => {
    await firstValueFrom(
      store.dispatch(new LoginScreenAction.LoginUser('user@example.com', 'password1')),
    );
    expect(store.selectSnapshot(LoginScreenState.submitting)).toBe(true);

    await firstValueFrom(store.dispatch(LoginScreenAction.LoginSettled));
    expect(store.selectSnapshot(LoginScreenState.submitting)).toBe(false);
  });

  it('clears submitting when authentication fails or succeeds', async () => {
    await firstValueFrom(
      store.dispatch(new LoginScreenAction.LoginUser('user@example.com', 'password1')),
    );
    await firstValueFrom(store.dispatch(new UserAction.AuthFailed('Invalid credentials')));

    expect(store.selectSnapshot(LoginScreenState.submitting)).toBe(false);
    expect(store.selectSnapshot(LoginScreenState.authError)).toBe('Invalid credentials');

    await firstValueFrom(
      store.dispatch(new LoginScreenAction.LoginUser('user@example.com', 'password1')),
    );
    await firstValueFrom(store.dispatch(new UserAction.UserLoggedInWithPassword(user)));
    expect(store.selectSnapshot(LoginScreenState.submitting)).toBe(false);
  });

  it('treats a missing persisted submitting flag as false', () => {
    store.reset({
      loginScreenState: {
        authErrMessage: null,
      },
    });

    expect(store.selectSnapshot(LoginScreenState.submitting)).toBe(false);
  });
});
