import { ETaskRepoServiceError } from '@brainassistant/contracts';
import { Task, TaskPresitant } from '../domain/models/task.js';
import { IDbModels } from '../infra/database/mongodb/index.js';
import { isMongoDuplicateKeyError } from '../infra/database/mongodb/mongo-error.js';
import { TaskDocument } from '../infra/database/mongodb/task.model.js';
import { TaskMapper } from '../mappers/task.mapper.js';
import { ServiceError } from '../core/service-error.js';
import { Result } from '../core/result.js';
import { serviceFail } from '../core/service-fail.factory.js';
import { ServiceErrorLevel } from '../core/service-error-level.enum.js';
import { ETaskRepoLoadError } from './task-repo.service.error.js';
import { SyncRevisionService } from './sync-revision.service.js';

export { ETaskRepoServiceError, ETaskRepoLoadError };

export type RevisionedTask = {
  syncRevision: number;
  task: Task | null;
};

export class TaskRepoService {
  private readonly revisions: SyncRevisionService;

  constructor(private readonly models: IDbModels) {
    this.revisions = new SyncRevisionService(models);
  }

  public async create(task: Task): Promise<void> {
    const taskData: TaskPresitant = TaskMapper.toPersistence(task);

    try {
      await this.models.TaskModel.create(taskData);
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        await this.ownDocumentIfDuplicateKey(task, error);
        return;
      }
      throw error;
    }
    await this.revisions.stampTask(task.userId, task.id.toString());
  }

  public async save(task: Task): Promise<TaskDocument> {
    const taskModel = this.models.TaskModel;

    const taskPresitant: TaskPresitant = TaskMapper.toPersistence(task);
    const taskId = task.id.toString();

    const filter = { _id: taskId };
    const { description, ...rest } = taskPresitant;
    const update =
      description === undefined
        ? { $set: rest, $unset: { description: 1 as const } }
        : { $set: { ...rest, description } };

    const updatedTask = await taskModel.findOneAndUpdate(filter, update);
    if (!updatedTask) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    await this.revisions.stampTask(task.userId, taskId);
    return updatedTask;
  }

  public async getUserTaskById(
    userId: string,
    taskId: string,
  ): Promise<Result<Task, ServiceError<ETaskRepoServiceError>>> {
    const TaskModel = this.models.TaskModel;
    const params = {
      _id: taskId,
      userId: userId,
    };
    const taskDocument = await TaskModel.findOne(params).lean();

    if (!taskDocument)
      return serviceFail<ETaskRepoServiceError>(
        `The task with id = "${taskId}" for user with id = ${userId} dosn't exists`,
        ETaskRepoServiceError.UserTaskNotFound,
      );

    const task = TaskMapper.toDomain(taskDocument);
    return Result.ok<Task, ServiceError<ETaskRepoServiceError>>(task);
  }

  public async getSinceRevision(userId: string, revision: number): Promise<RevisionedTask[]> {
    const rows: TaskPresitant[] = await this.models.TaskModel.find({
      userId,
      syncRevision: { $gt: revision },
    })
      .sort({ syncRevision: 1 })
      .lean();

    return rows.flatMap(raw => {
      if (typeof raw.syncRevision !== 'number') {
        return [];
      }
      return [{ syncRevision: raw.syncRevision, task: this.toDomainIfValid(raw) }];
    });
  }

  private toDomainIfValid(raw: TaskPresitant): Task | null {
    const task = TaskMapper.toDomain(raw);
    const invariants = task.checkWriteInvariants();
    if (invariants.isSuccess) {
      return task;
    }

    void serviceFail<ETaskRepoLoadError>(
      'Persisted task failed write-time validation and was skipped',
      ETaskRepoLoadError.PersistedTaskInvalid,
      {
        level: ServiceErrorLevel.Low,
        metadata: {
          taskId: task.id.toString(),
          userId: task.userId,
          domainCode: invariants.error.code,
        },
      },
    );
    return null;
  }

  public async removeTagIdFromUserTasks(userId: string, tagId: string): Promise<void> {
    const affected = await this.models.TaskModel.find({ userId, tagIds: tagId })
      .select('_id')
      .lean();
    await this.models.TaskModel.updateMany(
      { userId, tagIds: tagId },
      { $pull: { tagIds: tagId }, $set: { modifiedAt: new Date() } },
    );
    for (const task of affected) {
      await this.revisions.stampTask(userId, String(task._id));
    }
  }

  public async deleteTaskById(taskId: string): Promise<void> {
    await this.models.TaskModel.deleteOne({
      _id: taskId,
    });
  }

  public async exists(taskId: string, userId?: string): Promise<boolean> {
    const TaskModel = this.models.TaskModel;
    const params: { _id: string; userId?: string } = { _id: taskId };
    if (userId) {
      params.userId = userId;
    }
    const existingTask = await TaskModel.findOne(params);
    const found = !!existingTask;
    return found;
  }

  private async ownDocumentIfDuplicateKey(task: Task, error: unknown): Promise<void> {
    const existing = await this.models.TaskModel.findOne({
      _id: task.id.toString(),
      userId: task.userId,
    });
    if (existing) {
      return;
    }

    throw error;
  }
}
