import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';
import { LoginScreenAction } from 'src/app/mobile-app/components/screens/login-screen/login-screen.actions';
import { LoginScreenComponent } from 'src/app/mobile-app/components/screens/login-screen/login-screen.component';
import { LoginScreenState } from 'src/app/mobile-app/components/screens/login-screen/login-screen.state';
import { AppAction } from 'src/app/shared/state/app.actions';

describe('LoginScreenComponent', () => {
  let fixture: ComponentFixture<LoginScreenComponent>;
  let store: { dispatch: jest.Mock; selectSignal: jest.Mock };
  const authError = signal<string | null>(null);
  const submitting = signal(false);

  beforeEach(async () => {
    authError.set(null);
    submitting.set(false);
    store = {
      dispatch: jest.fn(),
      selectSignal: jest.fn((selector: unknown) =>
        selector === LoginScreenState.authError ? authError : submitting,
      ),
    };

    await TestBed.configureTestingModule({
      imports: [LoginScreenComponent],
      providers: [{ provide: Store, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginScreenComponent);
    fixture.detectChanges();
  });

  it('shows email and password login, Google sign-in, and the sign-up prompt', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="login-email"]')).not.toBeNull();
    expect(host.querySelector('[data-test="login-password"]')).not.toBeNull();
    expect(host.querySelector('[data-test="login-submit"]')?.textContent).toContain('Login');
    expect(host.textContent).toContain('OR');
    expect(host.querySelector('[data-test="sign-in-with-google"]')?.textContent).toContain(
      'Sign in with Google',
    );
    expect(host.textContent).toContain('Don\u2019t have an account?');
    expect(host.querySelector('[data-test="login-signup"]')?.textContent).toContain('Sign Up');
    expect(host.querySelector('[data-test="login-email-error"]')).toBeNull();
    expect(host.querySelector('[data-test="login-password-error"]')).toBeNull();
  });

  it('shows the invalid email message after the email field is left', () => {
    const host = fixture.nativeElement as HTMLElement;
    const email = host.querySelector('[data-test="login-email"]') as HTMLInputElement;

    email.value = 'not-an-email';
    email.dispatchEvent(new Event('input'));
    email.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(host.querySelector('[data-test="login-email-error"]')?.textContent).toContain(
      'Please enter a valid email address.',
    );
    expect(host.querySelector('[data-test="login-password-error"]')).toBeNull();
  });

  it('shows validation messages when login is attempted with an empty form', () => {
    const host = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(host.querySelector('[data-test="login-email-error"]')?.textContent).toContain(
      'Please enter a valid email address.',
    );
    expect(host.querySelector('[data-test="login-password-error"]')?.textContent).toContain(
      'Please input password, not less than 8 symbols',
    );
    expect(
      store.dispatch.mock.calls.some(([action]) => action instanceof LoginScreenAction.LoginUser),
    ).toBe(false);
  });

  it('toggles password visibility', () => {
    const host = fixture.nativeElement as HTMLElement;
    const password = host.querySelector('[data-test="login-password"]') as HTMLInputElement;
    const toggle = host.querySelector(
      '[data-test="login-password-visibility"]',
    ) as HTMLButtonElement;

    expect(password.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Show password');
    expect(toggle.textContent).toContain('visibility_off');

    toggle.click();
    fixture.detectChanges();

    expect(password.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Hide password');
    expect(toggle.textContent).not.toContain('visibility_off');
  });

  it('submits a valid email and password and offers sign up', () => {
    fixture.componentInstance.form.setValue({
      email: 'user@example.com',
      password: 'password1',
    });
    fixture.componentInstance.onSubmit();

    expect(store.dispatch).toHaveBeenCalledWith(
      new LoginScreenAction.LoginUser('user@example.com', 'password1'),
    );

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-test="login-signup"]')
      ?.click();

    expect(store.dispatch).toHaveBeenCalledWith(AppAction.NavigateToSingUpScreen);
  });

  it('shows the authentication error returned by the server', () => {
    authError.set('Invalid credentials');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[data-test="login-auth-error"]')
        ?.textContent,
    ).toContain('Invalid credentials');
  });

  it('disables the form and marks login busy while the request is in progress', () => {
    submitting.set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const submit = host.querySelector('[data-test="login-submit"]') as HTMLButtonElement;

    expect(submit.disabled).toBe(true);
    expect(submit.getAttribute('aria-busy')).toBe('true');
    expect(submit.textContent).toContain('progress_activity');
    expect((host.querySelector('[data-test="login-email"]') as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});
