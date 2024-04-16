import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { ActivatedRoute } from '@angular/router';
import { GoogleAuthRedirectScreenAction } from './google-auth-redirect.actions';
import { GoogleAPIService } from 'src/app/shared/services/integrations/google-api.service';
import { GoogleAPIAction } from 'src/app/shared/services/integrations/google-api.actions';
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
  constructor(
    private activatedRoute: ActivatedRoute,
    private googleAPIService: GoogleAPIService
  ) {}
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
  async opened(ctx: StateContext<IGoogleAuthRedirectScreenStateModel>) {
    ctx.patchState({
      ...defaults,
    });

    /**
     * #NOTE
     * Take the code from the redirect path.
     */
    const code: string = this.activatedRoute.snapshot.queryParamMap.get('code');

    /**
     * #NOTE
     * Send the code to the backend for authentication.
     */
    this.googleAPIService
      .authenticateUser(code)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          ctx.patchState({
            isLogging: false,
            errorOccurred: true,
          });

          /**
           * #NOTE
           * Handle potential errors.
           */
          if (err?.error?.name === 'GOOGLE_OAUTH_EMAIL_ALREADY_IN_USE') {
            ctx.patchState({ errorMessage: err.error.message });
          }
          return EMPTY;
        })
      )
      .subscribe((userData: User) => {
        /**
         * #NOTE
         * Set the authenticated user from the response locally.
         */
        ctx.patchState({
          isLogging: false,
        });
        ctx.dispatch(new GoogleAPIAction.UserAuthenticated(userData));
        ctx.dispatch(AppAction.NavigateToProfileScreen);
      });
  }
}
