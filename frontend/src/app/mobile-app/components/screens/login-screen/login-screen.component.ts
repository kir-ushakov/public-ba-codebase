import { Component, effect, inject, OnInit, signal, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { SignInWithGoogleBtnComponent } from 'src/app/shared/components/ui-elements/sign-in-with-google-btn/sign-in-with-google-btn.component';
import { FormControlsOf } from 'src/app/shared/forms/types/form-controls-of';
import { AppAction } from 'src/app/shared/state/app.actions';
import { LoginScreenAction } from './login-screen.actions';
import { LoginScreenState } from './login-screen.state';

const minPasswordLength = 8;

type LoginFormValue = {
  email: string;
  password: string;
};

@Component({
  selector: 'ba-login',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss'],
  imports: [ReactiveFormsModule, SignInWithGoogleBtnComponent],
})
export class LoginScreenComponent implements OnInit {
  readonly passwordVisible = signal(false);
  readonly emailErrorVisible = signal(false);
  readonly passwordErrorVisible = signal(false);
  readonly form = new FormGroup<FormControlsOf<LoginFormValue>>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(minPasswordLength)],
    }),
  });
  readonly authError: Signal<string | null>;
  readonly submitting: Signal<boolean>;

  private readonly store = inject(Store);
  private submitAttempted = false;

  constructor() {
    this.authError = this.store.selectSignal(LoginScreenState.authError);
    this.submitting = this.store.selectSignal(LoginScreenState.submitting);

    effect(() => {
      if (this.submitting()) {
        this.form.disable({ emitEvent: false });
      } else if (this.form.disabled) {
        this.form.enable({ emitEvent: false });
      }
    });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.store.dispatch(LoginScreenAction.FieldValuesChanged);
      this.syncValidationMessages();
    });

    this.form.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.syncValidationMessages();
    });
  }

  ngOnInit(): void {
    this.store.dispatch(LoginScreenAction.Opened);
  }

  onSubmit(): void {
    this.submitAttempted = true;
    this.form.markAllAsTouched();
    this.syncValidationMessages();

    if (this.form.invalid || this.submitting()) {
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.store.dispatch(new LoginScreenAction.LoginUser(email, password));
  }

  onEmailBlur(): void {
    this.form.controls.email.markAsTouched();
    this.syncValidationMessages();
  }

  onPasswordBlur(): void {
    this.form.controls.password.markAsTouched();
    this.syncValidationMessages();
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update(visible => !visible);
  }

  onSignUpClick(): void {
    this.store.dispatch(AppAction.NavigateToSingUpScreen);
  }

  private syncValidationMessages(): void {
    const email = this.form.controls.email;
    const password = this.form.controls.password;
    const showEmailError =
      email.enabled && email.invalid && (email.touched || this.submitAttempted);
    const showPasswordError =
      password.enabled && password.invalid && (password.touched || this.submitAttempted);

    this.emailErrorVisible.set(showEmailError);
    this.passwordErrorVisible.set(showPasswordError);
  }
}
