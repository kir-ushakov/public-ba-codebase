import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export enum EReleaseClientIdUsecaseError {
  UserDoesNotExist = 'RELEASE_CLIENT_ID_USECASE_ERROR__USER_DOES_NOT_EXIST',
}

export const ReleaseClientIdErrors = {
  UserDoesNotExist: (userId: string): Result<never, UseCaseError<EReleaseClientIdUsecaseError>> =>
    Result.fail(
      new UseCaseError<EReleaseClientIdUsecaseError>(
        EReleaseClientIdUsecaseError.UserDoesNotExist,
        `The user with id = "${userId}" dosn't exists`,
        EHttpStatus.NotFound,
      ),
    ),
};
