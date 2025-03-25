import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../shared/infra/http/models/base-controller.js';

export enum EGetChangesError {
  ClientNotFound = 'GET_CHANGES_ERROR_CLIENT_NOT_FOUND',
}

export namespace GetChangesErrors {
  export class ClientNotFoundError extends Result<UseCaseError> {
    constructor(userId: string, clientId: string) {
      super(
        false,
        new UseCaseError(
          EHttpStatus.BadRequest,
          EGetChangesError.ClientNotFound,
          `The client with id = "${clientId}" for user ${userId} dosn't exists`
        )
      );
    }
  }
}
