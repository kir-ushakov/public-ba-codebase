import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

type ESignUpError = ESignUpUsecaseError;
export class SignUpError extends UseCaseError<ESignUpError> {}

export enum ESignUpUsecaseError {
  EmailAlreadyInUse = 'SING_UP_ERROR_EMAIL_ALREADY_IN_USE',
  EmailInvalid = 'EMAIL_INVALID_ERROR_EMAIL_ALREADY_IN_USE',
}

export namespace SignUpErrors {
  export class EmailAlreadyInUse extends Result<never, SignUpError> {
    constructor(email: string) {
      super(
        false,
        new SignUpError(
          ESignUpUsecaseError.EmailAlreadyInUse,
          `The email ${email} already exists`,
          EHttpStatus.Conflict,
        ),
      );
    }
  }

  export class EmailInvalid extends Result<never, SignUpError> {
    constructor(email: string) {
      super(
        false,
        new UseCaseError(
          ESignUpUsecaseError.EmailInvalid,
          `The email ${email} is invalid`,
          EHttpStatus.BadRequest,
        ),
      );
    }
  }

  /** TODO: This feature is temporarily unused
   * 
  export class VerificationEmailSendingFailed extends Result<never, SignUpError> {
    constructor() {
      super(false, {
        message: `Verification email sending was failed`,
      } as UseCaseError);
    }
  }*/
}
