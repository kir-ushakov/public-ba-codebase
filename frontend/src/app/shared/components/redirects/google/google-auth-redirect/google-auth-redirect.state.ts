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
import {
  GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY,
  GOOGLE_OAUTH_FORCE_CONSENT_URL,
} from 'src/app/shared/constants/google-oauth.const';
import { readApiErrorName } from 'src/app/shared/helpers/google-refresh-token-invalid.function';

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
  ): Promise<void> {
    ctx.patchState({ ...defaults });

    if (payload.code == null || payload.code === '') {
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
    sessionStorage.removeItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY);
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
      sessionStorage.removeItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY);
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
    const alreadyRetried = sessionStorage.getItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY) === '1';

    if (!alreadyRetried) {
      sessionStorage.setItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY, '1');
      window.location.href = GOOGLE_OAUTH_FORCE_CONSENT_URL;
      return;
    }

    sessionStorage.removeItem(GOOGLE_FORCE_CONSENT_ATTEMPT_STORAGE_KEY);
  }
}
