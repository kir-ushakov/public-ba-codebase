import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { EActionType } from '../../../../shared/domain/models/action-type.enum.js';
import { TagMapper } from '../../../../shared/mappers/tag.mapper.js';
import { TaskMapper } from '../../../../shared/mappers/task.mapper.js';
import { ActionRepo } from '../../../../shared/repo/action.repo.js';
import { TagRepoService } from '../../../../shared/repo/tag-repo.service.js';
import { TaskRepoService } from '../../../../shared/repo/task-repo.service.js';
import { SyncRevisionService } from '../../../../shared/repo/sync-revision.service.js';
import { Change } from '../../domain/values/change.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EGetChangesUseCaseError } from './get-changes.errors.js';

export type GetChangesParams = {
  userId: string;
  afterRevision: number;
};

export type GetChangesPayload = {
  changes: Change[];
  syncRevision: number;
};

type RevisionRow = {
  syncRevision: number;
  change: Change | null;
};

export type GetChangesResult = Result<GetChangesPayload, UseCaseError<EGetChangesUseCaseError>>;

export class GetChanges implements UseCase<GetChangesParams, Promise<GetChangesResult>> {
  private taskRepoService: TaskRepoService;
  private tagRepoService: TagRepoService;
  private actionRepo: ActionRepo;
  private revisions: SyncRevisionService;

  constructor(
    taskRepoService: TaskRepoService,
    tagRepoService: TagRepoService,
    actionRepo: ActionRepo,
    revisions: SyncRevisionService,
  ) {
    this.taskRepoService = taskRepoService;
    this.tagRepoService = tagRepoService;
    this.actionRepo = actionRepo;
    this.revisions = revisions;
  }

  public async execute(params: GetChangesParams): Promise<GetChangesResult> {
    return this.pullByRevision(params.userId, params.afterRevision);
  }

  private async pullByRevision(userId: string, afterRevision: number): Promise<GetChangesResult> {
    await this.revisions.numberMissing(userId);
    const rows = await this.revisionRows(userId, afterRevision);
    const syncRevision = rows.reduce((max, row) => Math.max(max, row.syncRevision), afterRevision);
    const changes = rows.flatMap(row => (row.change ? [row.change] : []));
    return Result.ok({ changes, syncRevision });
  }

  private async revisionRows(userId: string, last: number): Promise<RevisionRow[]> {
    const rows: RevisionRow[] = [];
    const tasks = await this.taskRepoService.getSinceRevision(userId, last);
    for (const row of tasks) {
      rows.push({
        syncRevision: row.syncRevision,
        change: row.task
          ? new Change({
              entity: EChangedEntity.Task,
              action: EChangeAction.Updated,
              object: TaskMapper.toDTO(row.task),
            })
          : null,
      });
    }

    const tags = await this.tagRepoService.getSinceRevision(userId, last);
    for (const row of tags) {
      rows.push({
        syncRevision: row.syncRevision,
        change: row.tag
          ? new Change({
              entity: EChangedEntity.Tag,
              action: EChangeAction.Updated,
              object: TagMapper.toDTO(row.tag),
            })
          : null,
      });
    }

    const actions = await this.actionRepo.getSinceRevision(userId, last);
    for (const row of actions) {
      const deleted =
        row.action.type === EActionType.TaskDeleted
          ? EChangedEntity.Task
          : row.action.type === EActionType.TagDeleted
            ? EChangedEntity.Tag
            : null;
      if (!deleted) {
        rows.push({ syncRevision: row.syncRevision, change: null });
        continue;
      }
      rows.push({
        syncRevision: row.syncRevision,
        change: new Change({
          entity: deleted,
          action: EChangeAction.Deleted,
          object: {
            id: row.action.entityId.toString(),
            modifiedAt: row.action.occurredAt.toISOString(),
          },
        }),
      });
    }

    return rows.sort((left, right) => left.syncRevision - right.syncRevision);
  }
}
