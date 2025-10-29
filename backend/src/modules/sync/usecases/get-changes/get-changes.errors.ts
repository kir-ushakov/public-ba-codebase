import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';


export class GetChangesError extends UseCaseError<GetChangesErrorCodes> {}

export enum GetChangesErrorCode {
  ClientNotFound = 'GET_CHANGES_ERROR_CODE__CLIENT_NOT_FOUND',
}

type GetChangesErrorCodes = GetChangesErrorCode;

export namespace GetChangesErrors {
  export class ClientNotFoundError extends Result<never, GetChangesError> {
    constructor(userId: string, clientId: string) {
      super(
        false,
        new GetChangesError(
          GetChangesErrorCode.ClientNotFound,
          `The clientId = "${clientId}" for user ${userId} doesn't exist`,
          EHttpStatus.NotFound,
        ),
      );
    }
  }
}
