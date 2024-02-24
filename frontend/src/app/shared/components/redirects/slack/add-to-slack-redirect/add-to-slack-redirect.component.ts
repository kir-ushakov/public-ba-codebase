import { Component } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable, from } from 'rxjs';
import { AppAction } from 'src/app/shared/state/app.actions';
import { AddToSlackRedirectScreenState } from './add-to-slack-redirect.state';
import { AddToSlackRedirectScreenAction } from './add-to-slack-redirect.actions';

@Component({
  selector: 'app-add-to-slack-redirect',
  templateUrl: './add-to-slack-redirect.component.html',
  styleUrls: ['./add-to-slack-redirect.component.scss'],
})
export class AddToSlackRedirectComponent {
  @Select(AddToSlackRedirectScreenState.isInstalling)
  isInstalling$: Observable<boolean>;
  @Select(AddToSlackRedirectScreenState.errorOccurred)
  errorOccurred$: Observable<boolean>;

  constructor(private _store: Store) {}

  ngOnInit() {
    this._store.dispatch(AddToSlackRedirectScreenAction.Opened);
  }

  goToProfileScreen() {
    this._store.dispatch(AppAction.NavigateToProfileScreen);
  }
}
