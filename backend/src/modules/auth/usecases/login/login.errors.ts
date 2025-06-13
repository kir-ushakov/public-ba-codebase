import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

type ELoginError = ELoginUsecaseError;
export class LoginError extends UseCaseError<ELoginError> {}

export enum ELoginUsecaseError {
  LoginFailed = 'LOGIN_USECASE_ERROR__AUTHENTICATION_FAILED',
  UserAccountNotVerified = 'LOGIN_USECASE_ERROR__ACCOUNT_NOT_VERIFIED',
}

export namespace LoginError {
  export class LoginFailed extends Result<never, LoginError> {
    constructor() {
      super(
        false,
        new LoginError(
          ELoginUsecaseError.LoginFailed,
          'Authorization failed!',
          EHttpStatus.BadRequest,
        ),
      );
    }
  }

  export class UserAccountNotVerified extends Result<never, LoginError> {
    constructor() {
      super(
        false,
        new LoginError(
          ELoginUsecaseError.UserAccountNotVerified,
          'User account not verified!',
          EHttpStatus.BadRequest,
        ),
      );
    }
  }
}
