import { Task, TaskPresitant } from '../domain/models/task.js';
import { TaskDTO } from '@brainassistant/contracts';
import { UniqueEntityID } from '../domain/UniqueEntityID.js';
import { DomainError } from '../core/domain-error.js';

export class TaskMapper {
  public static toDomain(raw: TaskPresitant): Task | DomainError<Task> {
    const { userId, type, title, status, imageId, _id } = raw;

    const taskProps = { userId, type, title, status, imageId };
    const taskId = new UniqueEntityID(_id);

    const taskOrError = Task.create(taskProps, taskId);

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
    const taskPresitant = TaskMapper.toPersistence(task);
    return {
      ...taskPresitant,
      id: taskPresitant._id,
      createdAt: taskPresitant.createdAt.toISOString(),
      modifiedAt: taskPresitant.modifiedAt.toISOString(),
    };
  }
}
