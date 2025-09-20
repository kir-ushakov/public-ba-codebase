import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { GoogleAuthRedirectScreenAction } from './google-auth-redirect.actions';
import { GoogleAPIService } from 'src/app/shared/services/integrations/google-api.service';
import { UserAction } from 'src/app/shared/state/user.actions';
import { User } from 'src/app/shared/models';
import { EMPTY, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export interface IGoogleAuthRedirectScreenStateModel {
  isLogging: boolean;
  errorOccurred: boolean;
  errorMessage: string;
}

const defaults = { isLogging: true, errorOccurred: false, errorMessage: null };

@State<IGoogleAuthRedirectScreenStateModel>({
  name: 'googleAuthRedirectScreenState',
  defaults: defaults,
})
@Injectable()
export class GoogleAuthRedirectScreenState {
  constructor(private googleAPIService: GoogleAPIService) {}
  @Selector()
  static isLogging(state: IGoogleAuthRedirectScreenStateModel): boolean {
    return state.isLogging;
  }

  @Selector()
  static errorOccurred(state: IGoogleAuthRedirectScreenStateModel): boolean {
    return state.errorOccurred;
  }

  @Selector()
  static errorMessage(state: IGoogleAuthRedirectScreenStateModel): string {
    return state.errorMessage;
  }

  @Action(GoogleAuthRedirectScreenAction.Opened)
  async opened(
    ctx: StateContext<IGoogleAuthRedirectScreenStateModel>,
    payload: GoogleAuthRedirectScreenAction.Opened,
  ) {
    ctx.patchState({
      ...defaults,
    });

    const { code } = { ...payload };

    this.googleAPIService
      .authenticateUser(code)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          ctx.patchState({
            isLogging: false,
            errorOccurred: true,
          });

          if (err?.error?.name === 'GOOGLE_OAUTH_EMAIL_ALREADY_IN_USE') {
            ctx.patchState({ errorMessage: err.error.message });
          }
          return EMPTY;
        }),
      )
      .subscribe((userData: User) => {
        ctx.patchState({
          isLogging: false,
        });
        ctx.dispatch(new UserAction.UserAuthenticatedWithGoogle(userData));
        ctx.dispatch(AppAction.NavigateToProfileScreen);
      });
  }
}
