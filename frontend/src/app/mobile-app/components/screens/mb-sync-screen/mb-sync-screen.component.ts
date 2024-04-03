import { Component } from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Store } from '@ngxs/store';
import { MbSyncScreenAction } from './mb-sync-screen.actions';

@Component({
  selector: 'ba-mb-sync-screen',
  templateUrl: './mb-sync-screen.component.html',
  styleUrls: ['./mb-sync-screen.component.scss'],
})
export class MbSyncScreenComponent {
  syncForm = new UntypedFormGroup({
    password: new UntypedFormControl('', Validators.required),
  });

  constructor(private store: Store) {}

  submitPassword(): void {
    if (this.syncForm.invalid) return;
    this.store.dispatch(
      new MbSyncScreenAction.Relogin(this.syncForm.value.password)
    );
  }
}
