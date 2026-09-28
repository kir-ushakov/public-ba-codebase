import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/result.js';
import { ETaskError, ITaskProps, Task } from '../../../../../shared/domain/models/task.js';
import { UniqueEntityID } from '../../../../../shared/domain/UniqueEntityID.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { TagRepoService } from '../../../../../shared/repo/tag-repo.service.js';
import { SlackService } from '../../../../../shared/infra/integrations/slack/slack.service.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { CreateTaskErrors } from './create-task.errors.js';
import { DomainError } from '../../../../../shared/core/domain-error.js';

export type CreateTaskResult = Result<Task, UseCaseError<ETaskError>>;

export type CreateTaskParams = {
  taskProps: ITaskProps;
  id?: UniqueEntityID;
};

export class CreateTask implements UseCase<CreateTaskParams, Promise<CreateTaskResult>> {
  constructor(
    private readonly taskRepoService: TaskRepoService,
    private readonly tagRepoService: TagRepoService,
    private readonly slackService: SlackService,
  ) {}

  public async execute(params: CreateTaskParams): Promise<CreateTaskResult> {
    const taskProps: ITaskProps = params.taskProps;

    const tagsOwned = await this.tagsAreOwned(taskProps.userId, taskProps.tagIds);
    if (!tagsOwned) {
      return CreateTaskErrors.UnknownTag();
    }

    const taskOrError: Result<Task | never, DomainError<Task, ETaskError>> = Task.create(
      taskProps,
      params.id,
    );
    if (taskOrError.isFailure) {
      return CreateTaskErrors.DataInvalid(taskOrError.error);
    }

    const task: Task = taskOrError.getValue();
    await this.taskRepoService.create(task);

    // TODO: this._eventBus.publish(new TaskCreatedEvent(task));
    // TICKET: https://brainas.atlassian.net/browse/BA-119
    // TODO: We need to make slack feature available later
    // TOCKET: not created yet
    /*this._slackService.sendMessage(
      `New task created: '${task.title}'`,
      task.userId
    );*/

    return Result.ok(task);
  }

  private async tagsAreOwned(userId: string, tagIds: string[] | undefined): Promise<boolean> {
    if (tagIds === undefined || tagIds.length === 0) {
      return true;
    }

    const unique = [...new Set(tagIds)];
    const owned = await this.tagRepoService.findOwnedIds(userId, unique);
    return owned.length === unique.length;
  }
}
