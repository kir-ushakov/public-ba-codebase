import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export enum EGoogleAuthUsecaseError {
  EmailAlreadyInUse = 'GOOGLE_OAUTH_EMAIL_ALREADY_IN_USE',
  RefreshTokenNotReceived = 'GOOGLE_OAUTH_REFRESH_TOKEN_NOT_RECEIVED',
  AuthorizationFailed = 'GOOGLE_OAUTH_AUTHORIZATION_FAILED',
}

export const GoogleAuthErrors = {
  EmailAlreadyInUse: (email: string): Result<never, UseCaseError<EGoogleAuthUsecaseError>> =>
    Result.fail(
      new UseCaseError<EGoogleAuthUsecaseError>(
        EGoogleAuthUsecaseError.EmailAlreadyInUse,
        `Cannot create user with this email. The email ${email} already exists`,
        EHttpStatus.Conflict,
      ),
    ),
  RefreshTokenNotReceived: (): Result<never, UseCaseError<EGoogleAuthUsecaseError>> =>
    Result.fail(
      new UseCaseError<EGoogleAuthUsecaseError>(
        EGoogleAuthUsecaseError.RefreshTokenNotReceived,
        'Google refresh token was not received. Please repeat consent to re-authorize offline access.',
        EHttpStatus.BadRequest,
      ),
    ),
  AuthorizationFailed: (): Result<never, UseCaseError<EGoogleAuthUsecaseError>> =>
    Result.fail(
      new UseCaseError<EGoogleAuthUsecaseError>(
        EGoogleAuthUsecaseError.AuthorizationFailed,
        'Google authorization code is invalid or expired. Please try signing in again.',
        EHttpStatus.BadRequest,
      ),
    ),
};
