import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/result.js';
import { TaskDTO } from '@brainassistant/contracts';
import { Task } from '../../../../../shared/domain/models/task.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { UpdateTaskError, UpdateTaskErrors } from './update-task.errors.js';

type Request = {
  userId: string;
  dto: TaskDTO;
};

export type UpdateTaskResult = Result<Task, UpdateTaskError>;

export class UpdateTask implements UseCase<Request, Promise<UpdateTaskResult>> {
  constructor(private readonly taskRepoService: TaskRepoService) {}
  public async execute(req: Request): Promise<UpdateTaskResult> {
    const userId = req.userId;
    const taskDto = req.dto;

    const taskOrError = await this.taskRepoService.getUserTaskById(userId, taskDto.id);

    if (taskOrError.isFailure) {
      return new UpdateTaskErrors.TaskNotFoundError(taskOrError.error);
    }

    const task = taskOrError.getValue();
    const updateResult = task.update({
      type: taskDto.type,
      title: taskDto.title,
      status: taskDto.status,
      imageId: taskDto.imageId,
    });

    if (updateResult.isFailure) {
      return new UpdateTaskErrors.DataInvalid(updateResult.error);
    }

    await this.taskRepoService.save(task);

    return Result.ok(task);
  }
}
