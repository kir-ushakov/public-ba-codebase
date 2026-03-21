import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

enum EGoogleAuthUsecaseError {
  EmailAlreadyInUse = 'GOOGLE_OAUTH_EMAIL_ALREADY_IN_USE',
  RefreshTokenNotReceived = 'GOOGLE_OAUTH_REFRESH_TOKEN_NOT_RECEIVED',
  AuthorizationFailed = 'GOOGLE_OAUTH_AUTHORIZATION_FAILED',
}

type EGoogleAuthError = EGoogleAuthUsecaseError;

export class GoogleAuthError extends UseCaseError<EGoogleAuthError> {}

export namespace GoogleAuthErrors {
  export class EmailAlreadyInUse extends Result<never, GoogleAuthError> {
    constructor(email: string) {
      super(
        false,
        new GoogleAuthError(
          EGoogleAuthUsecaseError.EmailAlreadyInUse,
          `Cannot create user with this email. The email ${email} already exists`,
          EHttpStatus.Conflict,
        ),
      );
    }
  }

  export class RefreshTokenNotReceived extends Result<never, GoogleAuthError> {
    constructor() {
      super(
        false,
        new GoogleAuthError(
          EGoogleAuthUsecaseError.RefreshTokenNotReceived,
          'Google refresh token was not received. Please repeat consent to re-authorize offline access.',
          EHttpStatus.BadRequest,
        ),
      );
    }
  }

  export class AuthorizationFailed extends Result<never, GoogleAuthError> {
    constructor() {
      super(
        false,
        new GoogleAuthError(
          EGoogleAuthUsecaseError.AuthorizationFailed,
          'Google authorization code is invalid or expired. Please try signing in again.',
          EHttpStatus.BadRequest,
        ),
      );
    }
  }
}
