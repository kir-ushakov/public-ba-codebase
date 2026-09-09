import { ETaskRepoServiceError } from '@brainassistant/contracts';
import { Task, TaskPresitant } from '../domain/models/task.js';
import { IDbModels } from '../infra/database/mongodb/index.js';
import { TaskDocument } from '../infra/database/mongodb/task.model.js';
import { TaskMapper } from '../mappers/task.mapper.js';
import { ServiceError } from '../core/service-error.js';
import { Result } from '../core/result.js';
import { serviceFail } from '../core/service-fail.factory.js';
import { ServiceErrorLevel } from '../core/service-error-level.enum.js';
import { ETaskRepoLoadError } from './task-repo.service.error.js';

export { ETaskRepoServiceError, ETaskRepoLoadError };

export class TaskRepoService {
  constructor(private readonly models: IDbModels) {}

  public async create(task: Task): Promise<TaskDocument> {
    const taskData: TaskPresitant = TaskMapper.toPersistence(task);

    const TaskModel = this.models.TaskModel;

    const newTask: TaskDocument = await TaskModel.create(taskData);

    return newTask;
  }

  public async save(task: Task): Promise<TaskDocument> {
    const taskModel = this.models.TaskModel;

    const taskPresitant: TaskPresitant = TaskMapper.toPersistence(task);
    const taskId = task.id.toString();

    const filter = { _id: taskId };
    const update = { ...taskPresitant };

    const updatedTask: TaskDocument = await taskModel.findOneAndUpdate(filter, update);

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

  public async getChanges(userId: string, syncTime: Date): Promise<Task[]> {
    const changedTasks: TaskPresitant[] = await this.models.TaskModel.find({
      userId: userId,
      modifiedAt: { $gte: new Date(syncTime) },
    })
      .sort({ modifiedAt: 1 })
      .lean();

    return changedTasks.map(raw => this.toDomainIfValid(raw)).filter(task => task !== null);
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

  public async deleteTaskById(taskId: string): Promise<void> {
    const taskModel = this.models.TaskModel;
    await taskModel.deleteOne({
      _id: taskId,
    });
  }

  public async exists(taskId: string, userId: string = null): Promise<boolean> {
    const TaskModel = this.models.TaskModel;
    const params: { _id: string; userId?: string } = { _id: taskId };
    if (userId) {
      params.userId = userId;
    }
    const existingTask: TaskDocument = await TaskModel.findOne(params);
    const found = !!existingTask;
    return found;
  }
}
