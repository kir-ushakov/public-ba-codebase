import { Result } from '../../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { EHttpStatus } from '../../../../../shared/infra/http/models/base-controller.js';

export enum EUpdateTaskError {
  TaskNotFound = 'UPDATE_TASK_ERROR_TASK_NOT_FOUNDS',
}
export namespace UpdateTaskErrors {
  export class TaskNotFoundError extends Result<UseCaseError> {
    constructor(userId: string, taskId: string) {
      super(
        false,
        new UseCaseError(
          EHttpStatus.NotFound,
          EUpdateTaskError.TaskNotFound,
          `The task with id = "${taskId}" for user with id = ${userId} dosn't exists`
        )
      );
    }
  }
}
