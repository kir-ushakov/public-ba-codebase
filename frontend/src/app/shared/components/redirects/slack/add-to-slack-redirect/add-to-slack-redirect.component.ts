import { Component, Signal } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable, from } from 'rxjs';
import { AppAction } from 'src/app/shared/state/app.actions';
import { AddToSlackRedirectScreenState } from './add-to-slack-redirect.state';
import { AddToSlackRedirectScreenAction } from './add-to-slack-redirect.actions';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-add-to-slack-redirect',
    templateUrl: './add-to-slack-redirect.component.html',
    styleUrls: ['./add-to-slack-redirect.component.scss'],
    standalone: false
})
export class AddToSlackRedirectComponent {
  isInstalling: Signal<boolean> = this._store.selectSignal(AddToSlackRedirectScreenState.isInstalling);
  errorOccurred: Signal<boolean> = this._store.selectSignal(AddToSlackRedirectScreenState.errorOccurred);

  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _store: Store
  ) { }

  ngOnInit() {
    const code: string = this._activatedRoute.snapshot.queryParamMap.get('code');
    this._store.dispatch(new AddToSlackRedirectScreenAction.Opened(code));
  }

  goToProfileScreen() {
    this._store.dispatch(AppAction.NavigateToProfileScreen);
  }
}
