import { UseCase } from '../../../../../shared/core/UseCase.js';
import { TaskDTO } from '@brainassistant/contracts';
import { Result } from '../../../../../shared/core/result.js';
import { ETaskError, Task } from '../../../../../shared/domain/models/task.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { UniqueEntityID } from '../../../../../shared/domain/UniqueEntityID.js';
import { CreateTaskErrors } from './create-task.errors.js';
import { SlackService } from '../../../../../shared/infra/integrations/slack/slack.service.js';
import { DomainError } from '../../../../../shared/core/domain-error.js';
import { CreateTaskRequest, CreateTaskResult } from './create-task.contract.js';

export class CreateTask implements UseCase<CreateTaskRequest, Promise<CreateTaskResult>> {
  constructor(
    private readonly taskRepoService: TaskRepoService,
    private readonly slackService: SlackService,
  ) {}

  public async execute(req: CreateTaskRequest): Promise<CreateTaskResult> {
    const userId = req.userId;
    const dto: TaskDTO = req.changeableObjectDto;  // From SendChangeContract

    const taskOrError: Result<Task | never, DomainError<Task, ETaskError>> = Task.create(
      {
        ...dto,
        userId,
      },
      new UniqueEntityID(dto.id),
    );

    if (taskOrError.isFailure) {
      return new CreateTaskErrors.DataInvalid(taskOrError.error);
    }

    const task: Task = taskOrError.getValue();

    await this.taskRepoService.create(task);

    // TODO: this._eventBus.publish(new TaskCreatedEvent(task));
    // TICKET: https://brainas.atlassian.net/browse/BA-119
    // TODO: We need to make slack feature available later
    // TOCKET: not created yet
    /*this._slackService.sendMessage(
      `New task created: '${taskProps.title}'`,
      taskProps.userId
    );*/

    return Result.ok(task);
  }
}
