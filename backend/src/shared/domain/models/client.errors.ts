import { Result } from '../../core/Result';
import { UniqueEntityID } from '../UniqueEntityID';
import { DomainError } from '../../core/domain-error';

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
