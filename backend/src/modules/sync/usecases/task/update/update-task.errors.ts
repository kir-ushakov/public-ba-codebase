import { DomainError } from '../../../../../shared/core/domain-error.js';
import { Result } from '../../../../../shared/core/result.js';
import { ServiceError } from '../../../../../shared/core/service-error.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { ETaskError, Task } from '../../../../../shared/domain/models/task.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';
import { ETaskRepoServiceError } from '../../../../../shared/repo/task-repo.service.js';

export type UpdateTaskErrorCode = ETaskRepoServiceError | ETaskError;

export const UpdateTaskErrors = {
  TaskNotFoundError: (
    error: ServiceError<ETaskRepoServiceError>,
  ): Result<never, UseCaseError<UpdateTaskErrorCode>> =>
    Result.fail(
      new UseCaseError<UpdateTaskErrorCode>(error.code, error.message, EHttpStatus.NotFound),
    ),
  DataInvalid: (
    error: DomainError<Task, ETaskError>,
  ): Result<never, UseCaseError<UpdateTaskErrorCode>> =>
    Result.fail(
      new UseCaseError<UpdateTaskErrorCode>(error.code, error.message, EHttpStatus.BadRequest),
    ),
};
