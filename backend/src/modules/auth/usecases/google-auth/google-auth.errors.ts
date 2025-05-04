import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

enum EGoogleAuthUsecaseError {
  EmailAlreadyInUse = 'GOOGLE_AUTH_USECASE__EMAIL_ALREADY_IN_USE',
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
}
