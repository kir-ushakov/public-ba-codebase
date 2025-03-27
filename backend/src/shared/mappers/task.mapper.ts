import { ITaskProps, Task, TaskPresitant } from '../domain/models/task.js';
import { TaskDTO } from '../../modules/sync/domain/dtos/task.dto.js';
import { UniqueEntityID } from '../domain/UniqueEntityID.js';
import { DomainError } from '../core/domain-error.js';

export class TaskMapper {
  public static toDomain(raw: TaskPresitant): Task | DomainError {
    const taskOrError = Task.create(
      {
        userId: raw.userId,
        type: raw.type,
        title: raw.title,
        status: raw.status,
        createdAt: raw.createdAt,
        modifiedAt: raw.modifiedAt,
      },
      new UniqueEntityID(raw._id)
    );

    taskOrError.isFailure ? console.log(taskOrError.error) : '';

    return taskOrError.isSuccess ? taskOrError.getValue() : null;
  }

  public static toPersistence(task: Task): TaskPresitant {
    return {
      _id: task.id.toString(),
      userId: task.userId,
      type: task.type,
      title: task.title,
      status: task.status,
      createdAt: task.createdAt,
      modifiedAt: task.modifiedAt,
    };
  }

  public static toDTO(task: Task): TaskDTO {
    // For this moment DTO object is identical to Presistan object
    // so we can use same method (except _id-> id)
    const taskPresitant = TaskMapper.toPersistence(task) as TaskPresitant;
    const taskDto = { ...taskPresitant, id: taskPresitant._id };
    return taskDto;
  }
}
