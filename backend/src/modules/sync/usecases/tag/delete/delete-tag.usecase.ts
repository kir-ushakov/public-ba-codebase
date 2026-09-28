import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/result.js';
import { Action, IActionProps } from '../../../../../shared/domain/models/actions.js';
import { EActionType } from '../../../../../shared/domain/models/action-type.enum.js';
import { ActionRepo } from '../../../../../shared/repo/action.repo.js';
import { TagRepoService } from '../../../../../shared/repo/tag-repo.service.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { DeleteTagError } from './delete-tag.errors.js';

type Request = {
  userId: string;
  tagId: string;
};

type Response = Result<void, DeleteTagError>;

export class DeleteTagUsecase implements UseCase<Request, Promise<Response>> {
  constructor(
    private readonly tagRepoService: TagRepoService,
    private readonly taskRepoService: TaskRepoService,
    private readonly actionRepo: ActionRepo,
  ) {}

  public async execute(req: Request): Promise<Response> {
    const userId = req.userId;
    const tagId = req.tagId;

    const tagExists = await this.tagRepoService.exists(tagId, userId);
    if (!tagExists) {
      return Result.ok<void, DeleteTagError>();
    }

    await this.tagRepoService.deleteById(tagId);
    await this.taskRepoService.removeTagIdFromUserTasks(userId, tagId);

    const actionProps: IActionProps = {
      userId,
      type: EActionType.TagDeleted,
      occurredAt: new Date(),
      entityId: tagId,
    };
    const action: Action = Action.create(actionProps);
    await this.actionRepo.create(action);

    return Result.ok<void, DeleteTagError>();
  }
}
