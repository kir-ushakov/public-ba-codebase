import { Component } from '@angular/core';
import { createSelectMap, Store } from '@ngxs/store';
import { GoogleAuthRedirectScreenAction } from './google-auth-redirect.actions';
import { AppAction } from 'src/app/shared/state/app.actions';
import { GoogleAuthRedirectScreenState } from './google-auth-redirect.state';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ba-google-auth-redirect',
  templateUrl: './google-auth-redirect.component.html',
  styleUrls: ['./google-auth-redirect.component.scss'],
  imports: [CommonModule],
})
export class GoogleAuthRedirectScreenComponent {
  selectors = createSelectMap({
    isLogging: GoogleAuthRedirectScreenState.isLogging,
    errorOccurred: GoogleAuthRedirectScreenState.errorOccurred,
    errorMessage: GoogleAuthRedirectScreenState.errorMessage,
  });

  constructor(
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _store: Store,
  ) {}

  ngOnInit() {
    const code: string = this._activatedRoute.snapshot.queryParamMap.get('code');
    this._store.dispatch(new GoogleAuthRedirectScreenAction.Opened(code));
  }

  goToLoginScreen() {
    this._store.dispatch(AppAction.NavigateToLoginScreen);
  }
}
