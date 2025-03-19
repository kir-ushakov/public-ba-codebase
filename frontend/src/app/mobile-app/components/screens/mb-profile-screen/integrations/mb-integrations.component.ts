import { Component, HostBinding, Input, Signal } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserState } from 'src/app/shared/state/user.state';
import { MbProfileScreenAction } from '../mb-profile-screen.actions';
import { IMbIntegrationsComponentConfig } from './mb-integration.interface';
import { AddToSlackBtnComponent } from '../add-to-slack-btn/add-to-slack-btn.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'ba-mb-integrations',
    templateUrl: './mb-integrations.component.html',
    styleUrls: ['./mb-integrations.component.scss'],
    imports: [ CommonModule, AddToSlackBtnComponent ]
})
export class MbIntegrationsComponent {
  @HostBinding('class') get hostClass() {
    return this.config.styleClass;
  }
  @Input() config: IMbIntegrationsComponentConfig = { styleClass: 'default' };
  isAddedToSlack: Signal<boolean> = this._store.selectSignal(UserState.isAddedToSlack);

  constructor(private _store: Store) {}
  removeFromSlack() {
    this._store.dispatch(MbProfileScreenAction.RemoveFromSlack);
  }
}
