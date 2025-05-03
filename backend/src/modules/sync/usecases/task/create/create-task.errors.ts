import { DomainError } from '../../../../../shared/core/domain-error.js';
import { Result } from '../../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { ETaskError, Task } from '../../../../../shared/domain/models/task.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

type ECreateTaskError = ETaskError;
export class CreateTaskError extends UseCaseError<ECreateTaskError> {}

export namespace CreateTaskErrors {
  export class DataInvalid extends Result<never, CreateTaskError> {
    constructor(error: DomainError<Task, ETaskError>) {
      super(false, new CreateTaskError(error.code, error.message, EHttpStatus.BadRequest));
    }
  }
}
