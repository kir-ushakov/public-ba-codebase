import { Component, OnInit } from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { MbLoginScreenState } from './mb-login-screen.state';
import { MbLoginScreenAction } from './mb-login-screen.actions';

@Component({
  selector: 'app-mb-login',
  templateUrl: './mb-login-screen.component.html',
  styleUrls: ['./mb-login-screen.component.scss'],
})
export class MbLoginScreenComponent implements OnInit {
  @Select(MbLoginScreenState.authError) authError$: Observable<boolean>;

  public form: UntypedFormGroup = new UntypedFormGroup({
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    password: new UntypedFormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  constructor(private store: Store) {}

  ngOnInit() {
    this.subscribeToForm();
    this.store.dispatch(MbLoginScreenAction.Opened);
  }

  onSubmit() {
    const formValues = this.form.value;
    const email = formValues.email;
    const password = formValues.password;
    this.store.dispatch(new MbLoginScreenAction.LoginUser(email, password));
  }

  onSingUpClick() {
    this.store.dispatch(AppAction.NavigateToSingUpScreen);
  }

  private subscribeToForm() {
    this.form.valueChanges.subscribe(() => {
      this.store.dispatch(MbLoginScreenAction.FieldValuesChanged);
    });
  }
}
