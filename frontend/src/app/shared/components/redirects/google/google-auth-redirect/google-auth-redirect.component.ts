import { Component } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { GoogleAuthRedirectScreenAction } from './google-auth-redirect.actions';
import { AppAction } from 'src/app/shared/state/app.actions';
import { Observable } from 'rxjs';
import { GoogleAuthRedirectScreenState } from './google-auth-redirect.state';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'ba-google-auth-redirect',
    templateUrl: './google-auth-redirect.component.html',
    styleUrls: ['./google-auth-redirect.component.scss'],
    imports: [ CommonModule ]
})
export class GoogleAuthRedirectScreenComponent {
  @Select(GoogleAuthRedirectScreenState.isLogging)
  isLogging$: Observable<boolean>;
  @Select(GoogleAuthRedirectScreenState.errorOccurred)
  errorOccurred$: Observable<boolean>;
  @Select(GoogleAuthRedirectScreenState.errorMessage)
  errorMessage$: Observable<boolean>;

  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _store: Store) {}

  ngOnInit() {
    const code: string = this._activatedRoute.snapshot.queryParamMap.get('code');
    this._store.dispatch(new GoogleAuthRedirectScreenAction.Opened(code));
  }

  goToLoginScreen() {
    this._store.dispatch(AppAction.NavigateToLoginScreen);
  }
}
