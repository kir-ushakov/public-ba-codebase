import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/result.js';
import { IUpdateTaskRequestDTO } from './update-task.dto.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { UpdateTaskError, UpdateTaskErrors } from './update-task.errors.js';

type Request = {
  userId: string;
  dto: IUpdateTaskRequestDTO;
};

type Response = Result<void | never, UpdateTaskError>;

export class UpdateTask implements UseCase<Request, Promise<Response>> {
  constructor(private readonly taskRepoService: TaskRepoService) {}
  public async execute(req: Request): Promise<Response> {
    const userId = req.userId;
    const taskDto: IUpdateTaskRequestDTO = req.dto;

    const taskOrError = await this.taskRepoService.getUserTaskById(userId, taskDto.id);

    if (taskOrError.isFailure) {
      return new UpdateTaskErrors.TaskNotFoundError(taskOrError.error);
    }

    const task = taskOrError.getValue();
    task.update({
      ...taskDto,
    });

    await this.taskRepoService.save(task);

    return Result.ok<void, never>();
  }
}
