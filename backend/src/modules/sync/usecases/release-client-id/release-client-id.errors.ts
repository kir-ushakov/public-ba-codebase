import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export class ReleaseClientIdError extends UseCaseError<EReleaseClientIdError> {}

enum EReleaseClientIdUsecaseError {
  UserDoesNotExist = 'RELEASE_CLIENT_ID_USECASE_ERROR__USER_DOES_NOT_EXIST',
}

type EReleaseClientIdError = EReleaseClientIdUsecaseError;

export namespace ReleaseClientIdErrors {
  export class UserDoesNotExist extends Result<never, ReleaseClientIdError> {
    constructor(userId: string) {
      super(
        false,
        new ReleaseClientIdError(
          EReleaseClientIdUsecaseError.UserDoesNotExist,
          `The user with id = "${userId}" dosn't exists`,
          EHttpStatus.NotFound,
        ),
      );
    }
  }
}
