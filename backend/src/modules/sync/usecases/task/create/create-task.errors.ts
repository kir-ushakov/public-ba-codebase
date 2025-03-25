import { Result } from '../../../../../shared/core/Result.js';
import { DomainError } from '../../../../../shared/core/domain-error.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export namespace CreateTaskErrors {
  export class TaskDataInvalid extends Result<UseCaseError> {
    constructor(error: DomainError) {
      super(
        false,
        new UseCaseError(
          EHttpStatus.BadRequest,
          error.name,
          error.message,
          error.error
        )
      );
    }
  }
}
