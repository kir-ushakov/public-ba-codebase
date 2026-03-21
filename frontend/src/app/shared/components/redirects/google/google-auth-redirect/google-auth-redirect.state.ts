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
    const FORCE_CONSENT_ATTEMPT_KEY =
      'google_force_consent_attempted';

    ctx.patchState({
      ...defaults,
    });

    const { code } = { ...payload };

    this.googleAPIService
      .authenticateUser(code)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const forceConsentAttempted =
            sessionStorage.getItem(
              FORCE_CONSENT_ATTEMPT_KEY,
            ) === '1';

          ctx.patchState({
            isLogging: false,
            errorOccurred: true,
          });

          const errorCode = err?.error?.code ?? err?.error?.name;

          if (errorCode === 'GOOGLE_OAUTH_REFRESH_TOKEN_NOT_RECEIVED') {
            // One retry with prompt=consent to force issuing refresh_token.
            if (!forceConsentAttempted) {
              sessionStorage.setItem(
                FORCE_CONSENT_ATTEMPT_KEY,
                '1',
              );
              window.location.href =
                '/api/integrations/google/oauth-consent-screen?forceConsent=1&ngsw-bypass=1';
            } else {
              // Avoid sticky state between attempts.
              sessionStorage.removeItem(FORCE_CONSENT_ATTEMPT_KEY);
            }

            return EMPTY;
          }

          if (errorCode === 'GOOGLE_OAUTH_EMAIL_ALREADY_IN_USE') {
            ctx.patchState({ errorMessage: err.error.message });
          }

          if (errorCode === 'GOOGLE_OAUTH_AUTHORIZATION_FAILED') {
            sessionStorage.removeItem(FORCE_CONSENT_ATTEMPT_KEY);
            ctx.patchState({
              errorMessage: 'Google code expired. Please try signing in again.',
            });
          }
          return EMPTY;
        }),
      )
      .subscribe((userData: User) => {
        sessionStorage.removeItem(
          FORCE_CONSENT_ATTEMPT_KEY,
        );
        ctx.patchState({
          isLogging: false,
        });
        ctx.dispatch(new UserAction.UserAuthenticatedWithGoogle(userData));
        ctx.dispatch(AppAction.NavigateToProfileScreen);
      });
  }
}
