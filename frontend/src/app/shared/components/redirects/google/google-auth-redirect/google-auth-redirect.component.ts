import { Component } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { GoogleAuthRedirectScreenAction } from './google-auth-redirect.actions';
import { AppAction } from 'src/app/shared/state/app.actions';
import { Observable } from 'rxjs';
import { GoogleAuthRedirectScreenState } from './google-auth-redirect.state';

@Component({
  selector: 'ba-google-auth-redirect',
  templateUrl: './google-auth-redirect.component.html',
  styleUrls: ['./google-auth-redirect.component.scss'],
})
export class GoogleAuthRedirectScreenComponent {
  @Select(GoogleAuthRedirectScreenState.isLogging)
  isLogging$: Observable<boolean>;
  @Select(GoogleAuthRedirectScreenState.errorOccurred)
  errorOccurred$: Observable<boolean>;
  @Select(GoogleAuthRedirectScreenState.errorMessage)
  errorMessage$: Observable<boolean>;

  constructor(private store: Store) {}

  ngOnInit() {
    this.store.dispatch(GoogleAuthRedirectScreenAction.Opened);
  }

  goToLoginScreen() {
    this.store.dispatch(AppAction.NavigateToLoginScreen);
  }
}
