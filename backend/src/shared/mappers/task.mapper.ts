import { Task, TaskPresitant } from '../domain/models/task.js';
import { TaskDTO, ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { UniqueEntityID } from '../domain/UniqueEntityID.js';

export class TaskMapper {
  public static toDomain(raw: TaskPresitant): Task {
    const { userId, type, title, status, imageId, _id, createdAt, modifiedAt } = raw;

    return Task.reconstitute(
      {
        userId,
        type: type as ETaskType,
        title: title ?? '',
        status: status as ETaskStatus,
        imageId,
        createdAt,
        modifiedAt,
      },
      new UniqueEntityID(_id),
    );
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
