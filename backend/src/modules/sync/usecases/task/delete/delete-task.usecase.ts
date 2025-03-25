import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/Result.js';
import { DeleteTaskRequestDTO } from './delete-task.dto.js';
import { TaskRepo } from '../../../../../shared/repo/task.repo.js';
import { ActionRepo } from '../../../../../shared/repo/action.repo.js';
import {
  Action,
  IActionProps,
} from '../../../../../shared/domain/models/actions.js';
import { EActionType } from '../../../../../shared/infra/database/mongodb/action.model.js';

type Request = {
  userId: string;
  dto: DeleteTaskRequestDTO;
};

type Response = Result<void>;

export class DeleteTaskUsecase implements UseCase<Request, Promise<Response>> {
  private taskRepo: TaskRepo;
  private actionRepo: ActionRepo;

  constructor(taskRepo: TaskRepo, actionRepo: ActionRepo) {
    this.taskRepo = taskRepo;
    this.actionRepo = actionRepo;
  }

  public async execute(req: Request): Promise<Response> {
    const userId = req.userId;
    const taskId: string = req.dto.id;

    const taskExists = await this.doesTaskExist(userId, taskId);
    if (!taskExists) {
      return Result.ok<void>();
    }

    await this.taskRepo.deletedTaskById(taskId);

    const actionProps: IActionProps = {
      userId: userId,
      type: EActionType.TaskDeleted,
      occurredAt: new Date(),
      entityId: taskId,
    };
    const action: Action = await Action.create(actionProps);
    await this.actionRepo.create(action);

    return Result.ok<void>();
  }

  private async doesTaskExist(
    userId: string,
    taskId: string
  ): Promise<boolean> {
    return await this.taskRepo.exists(taskId, userId);
  }
}
