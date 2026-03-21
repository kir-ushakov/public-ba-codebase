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

/** Prevents infinite redirect loops when we auto-retry OAuth with forceConsent=1. */
const FORCE_CONSENT_ATTEMPT_STORAGE_KEY = 'google_force_consent_attempted';

const GOOGLE_OAUTH_FORCE_CONSENT_URL =
  '/api/integrations/google/oauth-consent-screen?forceConsent=1&ngsw-bypass=1';

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
    sessionStorage.removeItem(FORCE_CONSENT_ATTEMPT_STORAGE_KEY);
    ctx.patchState({ isLogging: false });
    ctx.dispatch(new UserAction.UserAuthenticatedWithGoogle(user));
    ctx.dispatch(AppAction.NavigateToProfileScreen);
  }

  /**
   * Backend returns stable `code` (and legacy `name`) for machine-readable errors.
   * UX branches: missing refresh token → one automatic consent retry; bad/expired code → message.
   */
  private onGoogleAuthHttpError(
    ctx: StateContext<IGoogleAuthRedirectScreenStateModel>,
    err: HttpErrorResponse,
  ): void {
    ctx.patchState({ isLogging: false, errorOccurred: true });

    const errorCode = GoogleAuthRedirectScreenState.readApiErrorCode(err);

    if (errorCode === 'GOOGLE_OAUTH_REFRESH_TOKEN_NOT_RECEIVED') {
      this.retryOnceWithForcedGoogleConsent();
      return;
    }

    if (errorCode === 'GOOGLE_OAUTH_AUTHORIZATION_FAILED') {
      sessionStorage.removeItem(FORCE_CONSENT_ATTEMPT_STORAGE_KEY);
      ctx.patchState({
        errorMessage: 'Google code expired. Please try signing in again.',
      });
      return;
    }

    if (errorCode === 'GOOGLE_OAUTH_EMAIL_ALREADY_IN_USE') {
      ctx.patchState({ errorMessage: err.error?.message });
    }
  }

  /**
   * Without prompt=consent Google may not return refresh_token for returning users.
   * We redirect once; flag avoids an endless loop if consent still yields no token.
   */
  private retryOnceWithForcedGoogleConsent(): void {
    const alreadyRetried =
      sessionStorage.getItem(FORCE_CONSENT_ATTEMPT_STORAGE_KEY) === '1';

    if (!alreadyRetried) {
      sessionStorage.setItem(FORCE_CONSENT_ATTEMPT_STORAGE_KEY, '1');
      window.location.href = GOOGLE_OAUTH_FORCE_CONSENT_URL;
      return;
    }

    sessionStorage.removeItem(FORCE_CONSENT_ATTEMPT_STORAGE_KEY);
  }

  private static readApiErrorCode(err: HttpErrorResponse): string | undefined {
    return err?.error?.code ?? err?.error?.name;
  }
}
