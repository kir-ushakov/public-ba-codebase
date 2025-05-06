import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export class GoogleAuthError extends UseCaseError<GetChangesErrorCodes> {}

export enum GetChangesErrorCode {
  ClientNotFound = 'GET_CHANGES_ERROR_CODE__CLIENT_NOT_FOUND',
}

type GetChangesErrorCodes = GetChangesErrorCode;

export namespace GetChangesErrors {
  export class ClientNotFoundError extends Result<never, GoogleAuthError> {
    constructor(userId: string, clientId: string) {
      super(
        false,
        new GoogleAuthError(
          GetChangesErrorCode.ClientNotFound,
          `The client with id = "${clientId}" for user ${userId} dosn't exists`,
          EHttpStatus.BadRequest,
        ),
      );
    }
  }
}
