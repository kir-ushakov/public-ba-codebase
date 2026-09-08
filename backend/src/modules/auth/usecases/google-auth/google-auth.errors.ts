import { EGoogleAuthUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export { EGoogleAuthUseCaseError };

export const GoogleAuthErrors = {
  EmailAlreadyInUse: (email: string): Result<never, UseCaseError<EGoogleAuthUseCaseError>> =>
    Result.fail(
      new UseCaseError<EGoogleAuthUseCaseError>(
        EGoogleAuthUseCaseError.EmailAlreadyInUse,
        `Cannot create user with this email. The email ${email} already exists`,
        EHttpStatus.Conflict,
      ),
    ),
  RefreshTokenNotReceived: (): Result<never, UseCaseError<EGoogleAuthUseCaseError>> =>
    Result.fail(
      new UseCaseError<EGoogleAuthUseCaseError>(
        EGoogleAuthUseCaseError.RefreshTokenNotReceived,
        'Google refresh token was not received. Please repeat consent to re-authorize offline access.',
        EHttpStatus.BadRequest,
      ),
    ),
  AuthorizationFailed: (): Result<never, UseCaseError<EGoogleAuthUseCaseError>> =>
    Result.fail(
      new UseCaseError<EGoogleAuthUseCaseError>(
        EGoogleAuthUseCaseError.AuthorizationFailed,
        'Google authorization code is invalid or expired. Please try signing in again.',
        EHttpStatus.BadRequest,
      ),
    ),
};
