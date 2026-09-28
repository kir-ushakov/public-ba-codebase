import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/result.js';
import { TaskDTO } from '@brainassistant/contracts';
import { Task } from '../../../../../shared/domain/models/task.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { TagRepoService } from '../../../../../shared/repo/tag-repo.service.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { UpdateTaskErrorCode, UpdateTaskErrors } from './update-task.errors.js';

type Request = {
  userId: string;
  dto: TaskDTO;
};

export type UpdateTaskResult = Result<Task, UseCaseError<UpdateTaskErrorCode>>;

export class UpdateTask implements UseCase<Request, Promise<UpdateTaskResult>> {
  constructor(
    private readonly taskRepoService: TaskRepoService,
    private readonly tagRepoService: TagRepoService,
  ) {}
  public async execute(req: Request): Promise<UpdateTaskResult> {
    const userId = req.userId;
    const taskDto = req.dto;

    if (taskDto.tagIds !== undefined) {
      const tagsOwned = await this.tagsAreOwned(userId, taskDto.tagIds);
      if (!tagsOwned) {
        return UpdateTaskErrors.UnknownTag();
      }
    }

    const taskOrError = await this.taskRepoService.getUserTaskById(userId, taskDto.id);

    if (taskOrError.isFailure) {
      return UpdateTaskErrors.TaskNotFoundError(taskOrError.error);
    }

    const task = taskOrError.getValue();
    const updateResult = task.update({
      type: taskDto.type,
      title: taskDto.title,
      status: taskDto.status,
      imageId: taskDto.imageId,
      description: taskDto.description,
      ...(taskDto.images !== undefined ? { images: taskDto.images } : {}),
      ...(taskDto.tagIds !== undefined ? { tagIds: taskDto.tagIds } : {}),
    });

    if (updateResult.isFailure) {
      return UpdateTaskErrors.DataInvalid(updateResult.error);
    }

    await this.taskRepoService.save(task);

    return Result.ok(task);
  }

  private async tagsAreOwned(userId: string, tagIds: string[]): Promise<boolean> {
    if (tagIds.length === 0) {
      return true;
    }

    const unique = [...new Set(tagIds)];
    const owned = await this.tagRepoService.findOwnedIds(userId, unique);
    return owned.length === unique.length;
  }
}
