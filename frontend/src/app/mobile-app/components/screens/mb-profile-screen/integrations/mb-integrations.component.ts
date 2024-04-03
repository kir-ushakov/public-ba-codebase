import { Component, HostBinding, Input } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserState } from 'src/app/shared/state/user.state';
import { MbProfileScreenAction } from '../mb-profile-screen.actions';
import { IMbIntegrationsComponentConfig } from './mb-integration.interface';

@Component({
  selector: 'ba-mb-integrations',
  templateUrl: './mb-integrations.component.html',
  styleUrls: ['./mb-integrations.component.scss'],
})
export class MbIntegrationsComponent {
  @HostBinding('class') get hostClass() {
    return this.config.styleClass;
  }
  @Input() config: IMbIntegrationsComponentConfig = { styleClass: 'default' };
  @Select(UserState.isAddedToSlack) isAddedToSlack$: Observable<boolean>;

  constructor(private _store: Store) {}
  removeFromSlack() {
    this._store.dispatch(MbProfileScreenAction.RemoveFromSlack);
  }
}
