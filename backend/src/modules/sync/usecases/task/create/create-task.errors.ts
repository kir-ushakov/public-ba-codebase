import { DomainError } from '../../../../../shared/core/domain-error.js';
import { Result } from '../../../../../shared/core/result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { ETaskError, Task } from '../../../../../shared/domain/models/task.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export const CreateTaskErrors = {
  DataInvalid: (error: DomainError<Task, ETaskError>): Result<never, UseCaseError<ETaskError>> =>
    Result.fail(new UseCaseError<ETaskError>(error.code, error.message, EHttpStatus.BadRequest)),
};
