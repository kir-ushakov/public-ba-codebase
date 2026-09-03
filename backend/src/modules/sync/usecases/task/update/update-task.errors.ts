import { DomainError } from '../../../../../shared/core/domain-error.js';
import { Result } from '../../../../../shared/core/result.js';
import { ServiceError } from '../../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { ETaskError, Task } from '../../../../../shared/domain/models/task.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';
import { ETaskRepoServiceError } from '../../../../../shared/repo/task-repo.service.js';

type EUpdateTaskError = ETaskRepoServiceError | ETaskError;
export class UpdateTaskError extends UseCaseError<EUpdateTaskError> {}

export namespace UpdateTaskErrors {
  export class TaskNotFoundError extends Result<never, UpdateTaskError> {
    constructor(error: ServiceError<ETaskRepoServiceError>) {
      super(false, new UpdateTaskError(error.code, error.message, EHttpStatus.NotFound));
    }
  }

  export class DataInvalid extends Result<never, UpdateTaskError> {
    constructor(error: DomainError<Task, ETaskError>) {
      super(false, new UpdateTaskError(error.code, error.message, EHttpStatus.BadRequest));
    }
  }
}
