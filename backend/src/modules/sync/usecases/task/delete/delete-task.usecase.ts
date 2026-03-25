import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/result.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { ActionRepo } from '../../../../../shared/repo/action.repo.js';
import { Action, IActionProps } from '../../../../../shared/domain/models/actions.js';
import { EActionType } from '../../../../../shared/infra/database/mongodb/action.model.js';
import { DeleteTaskError } from './delete-task.erros.js';

type Request = {
  userId: string;
  taskId: string;
};

type Response = Result<void | never, DeleteTaskError>;

export class DeleteTaskUsecase implements UseCase<Request, Promise<Response>> {
  private taskRepoService: TaskRepoService;
  private actionRepo: ActionRepo;

  constructor(taskRepoService: TaskRepoService, actionRepo: ActionRepo) {
    this.taskRepoService = taskRepoService;
    this.actionRepo = actionRepo;
  }

  public async execute(req: Request): Promise<Response> {
    const userId = req.userId;
    const taskId: string = req.taskId;

    const taskExists = await this.doesTaskExist(userId, taskId);
    if (!taskExists) {
      return Result.ok<void, never>();
    }

    await this.taskRepoService.deleteTaskById(taskId);

    const actionProps: IActionProps = {
      userId: userId,
      type: EActionType.TaskDeleted,
      occurredAt: new Date(),
      entityId: taskId,
    };
    const action: Action = await Action.create(actionProps);
    await this.actionRepo.create(action);

    return Result.ok<void, never>();
  }

  private async doesTaskExist(userId: string, taskId: string): Promise<boolean> {
    return await this.taskRepoService.exists(taskId, userId);
  }
}
