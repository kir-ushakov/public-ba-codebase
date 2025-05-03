import { Result } from '../../../../../shared/core/Result.js';
import { ServiceError } from '../../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';
import { ETaskRepoServiceError } from '../../../../../shared/repo/task.repo.js';

type EUpdateTaskError = ETaskRepoServiceError;
export class UpdateTaskError extends UseCaseError<EUpdateTaskError> {}

export namespace UpdateTaskErrors {
  export class TaskNotFoundError extends Result<never, UpdateTaskError> {
    constructor(error: ServiceError<ETaskRepoServiceError>) {
      super(false, new UpdateTaskError(error.code, error.message, EHttpStatus.NotFound));
    }
  }
}
