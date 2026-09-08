import { EReleaseClientIdUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export { EReleaseClientIdUseCaseError };

export const ReleaseClientIdErrors = {
  UserDoesNotExist: (userId: string): Result<never, UseCaseError<EReleaseClientIdUseCaseError>> =>
    Result.fail(
      new UseCaseError<EReleaseClientIdUseCaseError>(
        EReleaseClientIdUseCaseError.UserDoesNotExist,
        `The user with id = "${userId}" dosn't exists`,
        EHttpStatus.NotFound,
      ),
    ),
};
