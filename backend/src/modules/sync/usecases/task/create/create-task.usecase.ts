import { UseCase } from '../../../../../shared/core/UseCase.js';
import { CreateTaskRequestDTO } from './create-task.dto.js';
import { Result } from '../../../../../shared/core/Result.js';
import { ITaskProps, Task } from '../../../../../shared/domain/models/task.js';
import { TaskRepo } from '../../../../../shared/repo/task.repo.js';
import { DomainError } from '../../../../../shared/core/domain-error.js';
import { UniqueEntityID } from '../../../../../shared/domain/UniqueEntityID.js';
import { CreateTaskErrors } from './create-task.errors.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { SlackService } from '../../../../../shared/infra/integrations/slack/slack.service.js';

export class CreateTaskUC
  implements UseCase<CreateTaskRequestDTO, Promise<Result<any>>>
{
  private _taskRepo: TaskRepo;
  private _slackService: SlackService;

  constructor(taskRepo: TaskRepo, slackService: SlackService) {
    this._taskRepo = taskRepo;
    this._slackService = slackService;
  }

  public async execute(
    dto: CreateTaskRequestDTO
  ): Promise<Result<Task | UseCaseError>> {
    const taskProps: ITaskProps = {
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      status: dto.status,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const taskOrError: Result<Task | DomainError> = await Task.create(
      taskProps,
      new UniqueEntityID(dto.id)
    );

    if (taskOrError.isFailure) {
      return new CreateTaskErrors.TaskDataInvalid(
        taskOrError.error as DomainError
      );
    }

    const task: Task = taskOrError.getValue() as Task;

    await this._taskRepo.create(task);

    // TODO: Use DDD/node events here
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
