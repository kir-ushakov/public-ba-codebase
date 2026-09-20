import { Component, HostBinding, Input, Signal } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserState } from 'src/app/shared/state/user.state';
import { ProfileScreenAction } from '../profile-screen.actions';
import { IIntegrationsComponentConfig } from './integration.interface';
import { AddToSlackBtnComponent } from '../add-to-slack-btn/add-to-slack-btn.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ba-integrations',
  templateUrl: './integrations.component.html',
  styleUrls: ['./integrations.component.scss'],
  imports: [CommonModule, AddToSlackBtnComponent],
})
export class IntegrationsComponent {
  @HostBinding('class') get hostClass() {
    return this.config.styleClass;
  }
  @Input() config: IIntegrationsComponentConfig = { styleClass: 'default' };
  isAddedToSlack: Signal<boolean | undefined> = this._store.selectSignal(UserState.isAddedToSlack);

  constructor(private _store: Store) {}
  removeFromSlack() {
    this._store.dispatch(ProfileScreenAction.RemoveFromSlack);
  }
}
