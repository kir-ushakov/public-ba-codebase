import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { AppAction } from 'src/app/shared/state/app.actions';
import { GoogleAuthRedirectScreenAction } from './google-auth-redirect.actions';
import { GoogleAPIService } from 'src/app/shared/services/integrations/google-api.service';
import { UserAction } from 'src/app/shared/state/user.actions';
import { User } from 'src/app/shared/models';
import { EMPTY, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { EGoogleAuthUseCaseError } from '@brainassistant/contracts';
import { GoogleOAuthConsentService } from 'src/app/shared/services/integrations/google-oauth-consent.service';
import { readApiErrorName } from 'src/app/shared/helpers/http-error-body.function';

export interface IGoogleAuthRedirectScreenStateModel {
  isLogging: boolean;
  errorOccurred: boolean;
  errorMessage: string | null;
}

const defaults: IGoogleAuthRedirectScreenStateModel = {
  isLogging: true,
  errorOccurred: false,
  errorMessage: null,
};

@State<IGoogleAuthRedirectScreenStateModel>({
  name: 'googleAuthRedirectScreenState',
  defaults: defaults,
})
@Injectable()
export class GoogleAuthRedirectScreenState {
  constructor(
    private googleAPIService: GoogleAPIService,
    private readonly googleOAuthConsentService: GoogleOAuthConsentService,
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
  static errorMessage(state: IGoogleAuthRedirectScreenStateModel): string | null {
    return state.errorMessage;
  }

  @Action(GoogleAuthRedirectScreenAction.Opened)
  async opened(
    ctx: StateContext<IGoogleAuthRedirectScreenStateModel>,
    payload: GoogleAuthRedirectScreenAction.Opened,
  ): Promise<void> {
    ctx.patchState({ ...defaults });

    if (payload.code === undefined || payload.code === null || payload.code === '') {
      ctx.patchState({
        isLogging: false,
        errorOccurred: true,
        errorMessage: 'Google login failed: missing authorization code. Please try again.',
      });
      return;
    }

    this.googleAPIService
      .authenticateUser(payload.code)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.onGoogleAuthHttpError(ctx, err);
          return EMPTY;
        }),
      )
      .subscribe((user: User) => this.onGoogleAuthSuccess(ctx, user));
  }

  private onGoogleAuthSuccess(
    ctx: StateContext<IGoogleAuthRedirectScreenStateModel>,
    user: User,
  ): void {
    this.googleOAuthConsentService.clearForceConsentAttempt();
    ctx.patchState({ isLogging: false });
    ctx.dispatch(new UserAction.UserAuthenticatedWithGoogle(user));
    ctx.dispatch(AppAction.NavigateToProfileScreen);
  }

  /**
   * Backend JSON uses `name` = error code. Cached clients may still send `code`.
   * UX branches: missing refresh token → one automatic consent retry; bad/expired code → message.
   */
  private onGoogleAuthHttpError(
    ctx: StateContext<IGoogleAuthRedirectScreenStateModel>,
    err: HttpErrorResponse,
  ): void {
    ctx.patchState({ isLogging: false, errorOccurred: true });

    const errorCode = readApiErrorName(err);

    if (errorCode === EGoogleAuthUseCaseError.RefreshTokenNotReceived) {
      this.retryOnceWithForcedGoogleConsent();
      return;
    }

    if (errorCode === EGoogleAuthUseCaseError.AuthorizationFailed) {
      this.googleOAuthConsentService.clearForceConsentAttempt();
      ctx.patchState({
        errorMessage: 'Google code expired. Please try signing in again.',
      });
      return;
    }

    if (errorCode === EGoogleAuthUseCaseError.EmailAlreadyInUse) {
      ctx.patchState({ errorMessage: err.error?.message });
    }
  }

  /**
   * Without prompt=consent Google may not return refresh_token for returning users.
   * We redirect once; flag avoids an endless loop if consent still yields no token.
   */
  private retryOnceWithForcedGoogleConsent(): void {
    if (this.googleOAuthConsentService.hasRecentForceConsentAttempt()) {
      this.googleOAuthConsentService.clearForceConsentAttempt();
      return;
    }
    this.googleOAuthConsentService.openForceConsentScreen();
  }
}
