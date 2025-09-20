import { Component, Signal } from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Store } from '@ngxs/store';
import { MbSyncScreenAction } from './mb-sync-screen.actions';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EUserAuthType, UserState } from 'src/app/shared/state/user.state';
import { SignInWithGoogleBtnComponent } from 'src/app/shared/components/ui-elements/sign-in-with-google-btn/sign-in-with-google-btn.component';

@Component({
  selector: 'ba-mb-sync-screen',
  templateUrl: './mb-sync-screen.component.html',
  styleUrls: ['./mb-sync-screen.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    SignInWithGoogleBtnComponent,
  ],
})
export class MbSyncScreenComponent {
  authType: Signal<string> = this.store.selectSignal(UserState.authType);

  syncForm = new UntypedFormGroup({
    password: new UntypedFormControl('', Validators.required),
  });

  EUserAuthType = EUserAuthType;

  constructor(private store: Store) {}

  submitPassword(): void {
    if (this.syncForm.invalid) return;
    this.store.dispatch(new MbSyncScreenAction.Relogin(this.syncForm.value.password));
  }
}
