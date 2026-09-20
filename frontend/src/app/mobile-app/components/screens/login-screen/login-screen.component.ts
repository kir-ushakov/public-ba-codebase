import { Component, OnInit, Signal } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { LoginScreenState } from './login-screen.state';
import { LoginScreenAction } from './login-screen.actions';
import { SignInWithGoogleBtnComponent } from 'src/app/shared/components/ui-elements/sign-in-with-google-btn/sign-in-with-google-btn.component';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-login',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss'],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    SignInWithGoogleBtnComponent,
  ],
})
export class LoginScreenComponent implements OnInit {
  authError: Signal<string | null> = this.store.selectSignal(LoginScreenState.authError);

  public form: UntypedFormGroup = new UntypedFormGroup({
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    password: new UntypedFormControl('', [Validators.required, Validators.minLength(8)]),
  });

  constructor(private store: Store) {}

  ngOnInit() {
    this.subscribeToForm();
    this.store.dispatch(LoginScreenAction.Opened);
  }

  onSubmit() {
    const formValues = this.form.value;
    const email = formValues.email;
    const password = formValues.password;
    this.store.dispatch(new LoginScreenAction.LoginUser(email, password));
  }

  onSingUpClick() {
    this.store.dispatch(AppAction.NavigateToSingUpScreen);
  }

  private subscribeToForm() {
    this.form.valueChanges.subscribe(() => {
      this.store.dispatch(LoginScreenAction.FieldValuesChanged);
    });
  }
}
