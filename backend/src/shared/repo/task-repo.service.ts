import { Task, TaskPresitant } from '../domain/models/task.js';
import { IDbModels } from '../infra/database/mongodb/index.js';
import { TaskDocument } from '../infra/database/mongodb/task.model.js';
import { TaskMapper } from '../mappers/task.mapper.js';
import { ServiceError } from '../core/service-error.js';
import { Result } from '../core/Result.js';

export enum ETaskRepoServiceError {
  UserTaskNotFound = 'TASK_REPO_SERVICE_ERROR__USER_TASK_NOT_FOUND',
}

export class TaskRepoService {
  private _models: IDbModels;

  constructor(models: IDbModels) {
    this._models = models;
  }

  public async create(task: Task): Promise<TaskDocument> {
    const taskData: TaskPresitant = TaskMapper.toPersistence(task);

    const TaskModel = this._models.TaskModel;

    const newTask: TaskDocument = await TaskModel.create(taskData);

    return newTask;
  }

  public async save(task: Task): Promise<TaskDocument> {
    const taskModel = this._models.TaskModel;

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
    const TaskModel = this._models.TaskModel;
    let params = {
      _id: taskId,
      userId: userId,
    };
    const taskDocument = await TaskModel.findOne(params).lean();

    if (!taskDocument)
      return Result.fail(
        new ServiceError(
          `The task with id = "${taskId}" for user with id = ${userId} dosn't exists`,
          ETaskRepoServiceError.UserTaskNotFound,
        ),
      );

    const task = TaskMapper.toDomain(taskDocument) as Task;
    return Result.ok<Task, ServiceError<ETaskRepoServiceError>>(task);
  }

  public async getChanges(userId: string, syncTime: Date): Promise<Task[]> {
    const taskModel = this._models.TaskModel;
    const changedTasks: TaskDocument[] = await taskModel
      .find({ userId: userId, modifiedAt: { $gte: new Date(syncTime) } })
      .sort({ modifiedAt: 1 });
    return changedTasks.map(t => TaskMapper.toDomain(t) as Task);
  }

  public async deleteTaskById(taskId: string): Promise<void> {
    const taskModel = this._models.TaskModel;
    await taskModel.deleteOne({
      id: taskId,
    });
  }
}
