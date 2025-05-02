import { AppError } from '../../../../../shared/core/app-error.js';
import { Result } from '../../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { ETaskError } from '../../../../../shared/domain/models/task.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export type ECreateTaskError = ETaskError;

export namespace CreateTaskError {
  export class TaskDataInvalid extends Result<never, UseCaseError<ECreateTaskError>> {
    constructor(error: AppError<ECreateTaskError>) {
      super(
        false,
        new UseCaseError<ECreateTaskError>(error.code, error.message, EHttpStatus.BadRequest),
      );
    }
  }
}
