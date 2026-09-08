import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export enum GetChangesErrorCode {
  ClientNotFound = 'GET_CHANGES_ERROR_CODE__CLIENT_NOT_FOUND',
}

export const GetChangesErrors = {
  ClientNotFoundError: (
    userId: string,
    clientId: string,
  ): Result<never, UseCaseError<GetChangesErrorCode>> =>
    Result.fail(
      new UseCaseError<GetChangesErrorCode>(
        GetChangesErrorCode.ClientNotFound,
        `The clientId = "${clientId}" for user ${userId} doesn't exist`,
        EHttpStatus.NotFound,
      ),
    ),
};
