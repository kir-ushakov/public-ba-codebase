import { Task, TaskPresitant } from '../domain/models/task.js';
import { TaskDTO } from '../../modules/sync/domain/dtos/task.dto.js';
import { UniqueEntityID } from '../domain/UniqueEntityID.js';
import { DomainError } from '../core/domain-error.js';

export class TaskMapper {
  public static toDomain(raw: TaskPresitant): Task | DomainError<Task> {
    const { userId, type, title, status, imageUri, _id } = raw;

    const taskProps = { userId, type, title, status, imageUri };
    const taskId = new UniqueEntityID(_id);

    const taskOrError = Task.create(taskProps, taskId);

    if (taskOrError.isFailure) {
      console.log(taskOrError.error);
    }

    return taskOrError.isSuccess ? taskOrError.getValue() : null;
  }

  public static toPersistence(task: Task): TaskPresitant {
    const { id, userId, type, title, status, imageUri, createdAt, modifiedAt } = task;

    return {
      _id: id.toString(),
      userId,
      type,
      title,
      status,
      imageUri,
      createdAt,
      modifiedAt,
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
