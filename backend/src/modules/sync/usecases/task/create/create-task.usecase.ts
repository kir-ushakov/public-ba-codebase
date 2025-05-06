import { UseCase } from '../../../../../shared/core/UseCase.js';
import { CreateTaskRequestDTO } from './create-task.dto.js';
import { Result } from '../../../../../shared/core/Result.js';
import { ETaskError, Task } from '../../../../../shared/domain/models/task.js';
import { TaskRepoService } from '../../../../../shared/repo/task-repo.service.js';
import { UniqueEntityID } from '../../../../../shared/domain/UniqueEntityID.js';
import { CreateTaskError, CreateTaskErrors } from './create-task.errors.js';
import { SlackService } from '../../../../../shared/infra/integrations/slack/slack.service.js';
import { DomainError } from '../../../../../shared/core/domain-error.js';

type Request = {
  userId: string;
  dto: CreateTaskRequestDTO;
};

type Response = Promise<Result<Task | never, CreateTaskError>>;

export class CreateTask implements UseCase<Request, Response> {
  constructor(
    private readonly taskRepoService: TaskRepoService,
    private readonly slackService: SlackService,
  ) {}

  public async execute(req: Request): Promise<Result<Task | never, CreateTaskError>> {
    const userId = req.userId;
    const dto: CreateTaskRequestDTO = req.dto;

    const taskOrError: Result<Task | never, DomainError<Task, ETaskError>> = await Task.create(
      {
        ...dto,
        userId,
      },
      new UniqueEntityID(dto.id),
    );

    if (taskOrError.isFailure) {
      return new CreateTaskErrors.DataInvalid(taskOrError.error as DomainError<Task, ETaskError>);
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
