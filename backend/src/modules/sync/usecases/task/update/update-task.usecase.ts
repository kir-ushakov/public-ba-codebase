import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/Result.js';
import { IUpdateTaskRequestDTO } from './update-task.dto.js';
import { TaskRepo } from '../../../../../shared/repo/task.repo.js';
import { ITaskProps, Task } from '../../../../../shared/domain/models/task.js';
import { UpdateTaskErrors } from './update-task.errors.js';

type Request = {
  userId: string;
  dto: IUpdateTaskRequestDTO;
};

type Response = Result<void> | UpdateTaskErrors.TaskNotFoundError;

export class UpdateTask implements UseCase<Request, Promise<Response>> {
  private _taskRepo: TaskRepo;

  constructor(taskRepo: TaskRepo) {
    this._taskRepo = taskRepo;
  }

  public async execute(req: Request): Promise<Response> {
    const userId = req.userId;
    const taskDto: IUpdateTaskRequestDTO = req.dto;

    const taskExists = await this.doesTaskExist(userId, taskDto.id);

    if (!taskExists) {
      return new UpdateTaskErrors.TaskNotFoundError(userId, taskDto.id);
    }

    const taskProps: ITaskProps = {
      userId: taskDto.userId,
      type: taskDto.type,
      title: taskDto.title,
      status: taskDto.status,
      createdAt: new Date(taskDto.createdAt),
      modifiedAt: new Date(),
    };

    const task: Task = await this._taskRepo.getTaskById(taskDto.id);

    task.update(taskProps);

    await this._taskRepo.save(task);

    return Result.ok<void>();
  }

  private async doesTaskExist(
    userId: string,
    taskId: string
  ): Promise<boolean> {
    return await this._taskRepo.exists(taskId, userId);
  }
}
