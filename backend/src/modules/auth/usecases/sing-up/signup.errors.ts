import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export enum ESignUpError {
  EmailAlreadyInUse = 'SING_UP_ERROR_EMAIL_ALREADY_IN_USE',
  EmailInvalid = 'EMAIL_INVALID_ERROR_EMAIL_ALREADY_IN_USE',
}

export namespace SignUpErrors {
  export class EmailAlreadyInUse extends Result<UseCaseError> {
    constructor(email: string) {
      super(
        false,
        new UseCaseError(
          EHttpStatus.Conflict,
          ESignUpError.EmailAlreadyInUse,
          `The email ${email} already exists`
        )
      );
    }
  }

  export class EmailInvalid extends Result<UseCaseError> {
    constructor(email: string) {
      super(
        false,
        new UseCaseError(
          EHttpStatus.BadRequest,
          ESignUpError.EmailInvalid,
          `The email ${email} is invalid`
        )
      );
    }
  }

  export class VerificationEmailSendingFailed extends Result<UseCaseError> {
    constructor() {
      super(false, {
        message: `Verification email sending was failed`,
      } as UseCaseError);
    }
  }
}
