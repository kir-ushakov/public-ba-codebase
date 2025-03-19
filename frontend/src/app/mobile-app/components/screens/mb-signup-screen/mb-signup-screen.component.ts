import { Component, Signal } from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import {
  SignUpRequestDTO,
  SignUpResponseDTO,
} from 'src/app/shared/services/api/auth.service';
import { AppAction } from 'src/app/shared/state/app.actions';
import { MbSignupScreenAction } from './mb-signup-screen.actions';
import { MbSignupScreenState } from './mb-signup-screen.state';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'ba-mb-signup',
    templateUrl: './mb-signup-screen.component.html',
    styleUrls: ['./mb-signup-screen.component.scss'],
    imports: [ 
      CommonModule, 
      MatInputModule,
      ReactiveFormsModule
    ]
})
export class MbSignupScreenComponent {
  signUpResult: Signal<SignUpResponseDTO> = this.store.selectSignal(MbSignupScreenState.signUpResult);

  public form: UntypedFormGroup = new UntypedFormGroup({
    firstName: new UntypedFormControl('', Validators.required),
    lastName: new UntypedFormControl('', Validators.required),
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    password: new UntypedFormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  constructor(private store: Store) {}

  async onSubmit() {
    this.store.dispatch(
      new MbSignupScreenAction.SignupUser(this.form.value as SignUpRequestDTO)
    );
  }

  onLoginLinkClick() {
    this.store.dispatch(AppAction.NavigateToLoginScreen);
  }

  ngOnDestroy() {
    this.store.dispatch(MbSignupScreenAction.Closed);
  }
}
