import { Result } from '../../../../shared/core/Result.js';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { Action } from '../../../../shared/domain/models/actions.js';
import { Client } from '../../../../shared/domain/models/client.js';
import { Task } from '../../../../shared/domain/models/task.js';
import { EActionType } from '../../../../shared/infra/database/mongodb/action.model.js';
import { TaskMapper } from '../../../../shared/mappers/task.mapper.js';
import { ActionRepo } from '../../../../shared/repo/action.repo.js';
import { ClientRepo } from '../../../../shared/repo/client.repo.js';
import { TaskRepoService } from '../../../../shared/repo/task-repo.service.js';
import { TaskDTO } from '../../domain/dtos/task.dto.js';
import { Change, EChangeAction, EChangedEntity } from '../../domain/values/change.js';
import { IGetChangesRequestDTO } from './get-changes.dto.js';
import { GetChangesErrors } from './get-changes.errors.js';

export type GetChangesRequest = IGetChangesRequestDTO;
export type GetChangesResponse = Result<Change[]> | GetChangesErrors.ClientNotFoundError;

export class GetChangesUC implements UseCase<GetChangesRequest, Promise<GetChangesResponse>> {
  private clientRepo: ClientRepo;
  private taskRepoService: TaskRepoService;
  private actionRepo: ActionRepo;

  constructor(clientRepo: ClientRepo, taskRepoService: TaskRepoService, actionRepo: ActionRepo) {
    this.clientRepo = clientRepo;
    this.taskRepoService = taskRepoService;
    this.actionRepo = actionRepo;
  }

  public async execute(req: GetChangesRequest): Promise<GetChangesResponse> {
    const { userId, clientId } = req;
    const changes: Array<Change> = [];
    let client: Client;

    // TODO: hande potential error the right way
    // TICKET: https://brainas.atlassian.net/browse/BA-215
    try {
      client = await this.clientRepo.find(userId, clientId);
    } catch (err) {
      console.error(`Failed to find client (userId: ${userId}, clientId: ${clientId})`, err);
      return new GetChangesErrors.ClientNotFoundError(userId, clientId);
    }

    const lastSyncTime: Date = client.syncTime;
    const changedTasks: Task[] = await this.taskRepoService.getChanges(userId, lastSyncTime);

    for (let changedTask of changedTasks) {
      const taskDto: TaskDTO = TaskMapper.toDTO(changedTask);
      changes.push(
        new Change({
          entity: EChangedEntity.Task,
          action: EChangeAction.Updated,
          object: taskDto,
        }),
      );
    }

    const deleteTaskActions: Action[] = await this.actionRepo.getActionsOccurredSince(
      userId,
      lastSyncTime,
      EActionType.TaskDeleted,
    );

    for (let i = 0; i < deleteTaskActions.length; i++) {
      const deleteTaskAction: Action = deleteTaskActions[i];
      changes.push(
        new Change({
          entity: EChangedEntity.Task,
          action: EChangeAction.Deleted,
          object: {
            id: deleteTaskAction.entityId.toString(),
            modifiedAt: deleteTaskAction.occurredAt.toISOString(),
          },
        }),
      );
    }

    // TODO: do not save time here
    // we need to send server time of sync to client in response DTO
    // and wait confirm of successful sync request from client
    // after we need to set sync time of Client
    // during handle this second `confirm` request
    // TICKET: https://brainas.atlassian.net/browse/BA-76
    client.updateSyncTime(new Date());
    this.clientRepo.save(client);

    return Result.ok(changes);
  }
}
