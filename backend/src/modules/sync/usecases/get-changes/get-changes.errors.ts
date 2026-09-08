import { EGetChangesUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export { EGetChangesUseCaseError };

export const GetChangesErrors = {
  ClientNotFoundError: (
    userId: string,
    clientId: string,
  ): Result<never, UseCaseError<EGetChangesUseCaseError>> =>
    Result.fail(
      new UseCaseError<EGetChangesUseCaseError>(
        EGetChangesUseCaseError.ClientNotFound,
        `The clientId = "${clientId}" for user ${userId} doesn't exist`,
        EHttpStatus.NotFound,
      ),
    ),
};
