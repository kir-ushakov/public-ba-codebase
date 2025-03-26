import { Result } from '../../core/Result.js';
import { UniqueEntityID } from '../UniqueEntityID.js';
import { DomainError } from '../../core/domain-error.js';

export enum EClientError {
  InvalidClientId = 'INVALID_CLIENT_ID',
}

export namespace ClientError {
  export class InvalidClientIdError extends Result<DomainError> {
    public constructor(clintId: UniqueEntityID) {
      super(
        false,
        new DomainError(
          EClientError.InvalidClientId,
          `Invalid Client Id: ${clintId}`
        )
      );
    }
  }
}
