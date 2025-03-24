import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export enum EAuthenticateUserError {
  EmailAlreadyInUse = 'GOOGLE_OAUTH_EMAIL_ALREADY_IN_USE',
}

export namespace AuthenticateUserError {
  export class EmailAlreadyInUse extends Result<UseCaseError> {
    constructor(email: string) {
      super(
        false,
        new UseCaseError(
          EHttpStatus.Conflict,
          EAuthenticateUserError.EmailAlreadyInUse,
          `Cannot create user with this email. The email ${email} already exists`
        )
      );
    }
  }
}
