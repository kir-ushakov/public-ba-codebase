import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';

export namespace ReleaseClientIdErrors {
  export class UserDoesNotExistError extends Result<UseCaseError> {
    constructor(userId: string) {
      super(false, {
        message: `The user with id = "${userId}" dosn't exists`,
      } as UseCaseError);
    }
  }
}
