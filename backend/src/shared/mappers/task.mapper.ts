import { Task, TaskPresitant } from '../domain/models/task.js';
import { TaskDTO } from '@brainassistant/contracts';
import { UniqueEntityID } from '../domain/UniqueEntityID.js';
import { DomainError } from '../core/domain-error.js';

export class TaskMapper {
  public static toDomain(raw: TaskPresitant): Task | DomainError<Task> {
    const { userId, type, title, status, imageId, _id, createdAt, modifiedAt } = raw;

    const taskOrError = Task.reconstitute(
      { userId, type, title, status, imageId, createdAt, modifiedAt },
      new UniqueEntityID(_id),
    );

    if (taskOrError.isFailure) {
      console.log(taskOrError.error);
    }

    return taskOrError.isSuccess ? taskOrError.getValue() : null;
  }

  public static toPersistence(task: Task): TaskPresitant {
    const { id, userId, type, title, status, imageId, createdAt, modifiedAt } = task;

    return {
      _id: id.toString(),
      userId,
      type,
      title,
      status,
      imageId,
      createdAt,
      modifiedAt,
    };
  }

  public static toDTO(task: Task): TaskDTO {
    return {
      id: task.id.toString(),
      userId: task.userId,
      type: task.type,
      title: task.title,
      status: task.status,
      imageId: task.imageId,
      createdAt: task.createdAt.toISOString(),
      modifiedAt: task.modifiedAt.toISOString(),
    };
  }
}
