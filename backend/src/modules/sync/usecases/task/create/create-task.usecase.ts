import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/result.js';
import { ETaskError, ITaskProps, Task } from '../../../../../shared/domain/models/task.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { SlackService } from '../../../../../shared/infra/integrations/slack/slack.service.js';
import { CreateTaskError, CreateTaskErrors } from './create-task.errors.js';
import { DomainError } from '../../../../../shared/core/domain-error.js';


export type CreateTaskParams = {
  taskProps: ITaskProps;
};

export type CreateTaskResult = Result<Task, CreateTaskError>;


export class CreateTask implements UseCase<CreateTaskParams, Promise<CreateTaskResult>> {
  constructor(
    private readonly taskRepoService: TaskRepoService,
    private readonly slackService: SlackService,
  ) {}

  public async execute(params: CreateTaskParams): Promise<CreateTaskResult> {
    const taskProps: ITaskProps = params.taskProps;  

    const taskOrError: Result<Task | never, DomainError<Task, ETaskError>> = Task.create(taskProps);
    if (taskOrError.isFailure) {
      return new CreateTaskErrors.DataInvalid(taskOrError.error);
    }

    const task: Task = taskOrError.getValue() as Task;
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
}
