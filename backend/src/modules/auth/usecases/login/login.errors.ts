import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export enum ELoginErrorName {
  LoginFailed = 'LOGIN_ERROR_AUTHENTICATION_FAILED',
  UserAccountNotVerified = 'LOGIN_ERROR_ACCOUNT_NOT_VERIFIED',
}

export namespace LoginError {
  export class LoginFailed extends Result<UseCaseError> {
    constructor() {
      super(
        false,
        new UseCaseError(
          EHttpStatus.BadRequest,
          ELoginErrorName.LoginFailed,
          'Authorization failed!'
        )
      );
    }
  }

  export class UserAccountNotVerified extends Result<UseCaseError> {
    constructor() {
      super(
        false,
        new UseCaseError(
          EHttpStatus.BadRequest,
          ELoginErrorName.UserAccountNotVerified,
          'User account not verified!'
        )
      );
    }
  }
}
