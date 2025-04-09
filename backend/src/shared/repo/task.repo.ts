import { Task, TaskPresitant } from '../domain/models/task.js';
import { IDbModels } from '../infra/database/mongodb/index.js';
import { TaskDocument } from '../infra/database/mongodb/task.model.js';
import { TaskMapper } from '../mappers/task.mapper.js';

export class TaskRepo {
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

  public async exists(taskId: string, userId: string = null): Promise<boolean> {
    const TaskModel = this._models.TaskModel;
    let params = { _id: taskId };
    if (userId) {
      params['userId'] = userId;
    }
    const existingTask: TaskDocument = await TaskModel.findOne(params);
    const found: boolean = !!existingTask === true;
    return found;
  }

  public async save(task: Task): Promise<TaskDocument> {
    const taskModel = this._models.TaskModel;

    const taskPresitant: TaskPresitant = TaskMapper.toPersistence(task);
    const taskId = task.id.toString();

    const filter = { _id: taskId };
    const update = { ...taskPresitant };

    const updatedTask: TaskDocument = await taskModel.findOneAndUpdate(
      filter,
      update,
      { useFindAndModify: false }
    );

    return updatedTask;
  }

  public async getTaskById(taskId: string): Promise<Task> {
    const TaskModel = this._models.TaskModel;
    const taskDocument: TaskDocument = await TaskModel.findOne({ _id: taskId });
    const found = !!taskDocument === true;
    if (!found) throw new Error('Task not found');
    const task = TaskMapper.toDomain(taskDocument) as Task;
    return task;
  }

  public async getChanges(userId: string, syncTime: Date): Promise<Task[]> {
    const taskModel = this._models.TaskModel;
    const changedTasks: TaskDocument[] = await taskModel
      .find({ userId: userId, modifiedAt: { $gte: new Date(syncTime) } })
      .sort({ modifiedAt: 1 });
    return changedTasks.map((t) => TaskMapper.toDomain(t) as Task);
  }

  public async deletedTaskById(taskId: string) {
    const taskModel = this._models.TaskModel;
    await taskModel.deleteOne({
      id: taskId,
    });
  }
}
