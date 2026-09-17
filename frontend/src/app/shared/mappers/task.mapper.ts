import { TaskDTO } from '@brainassistant/contracts';
import { Task } from '../models/task.model';
import { isEmptyTaskDescription } from '../helpers/is-empty-task-description.function';

export class TasksMapper {
  public static toModel(taskDto: TaskDTO): Task {
    const task: Task = {
      id: taskDto.id,
      userId: taskDto.userId,
      type: taskDto.type,
      title: taskDto.title,
      status: taskDto.status,
      imageId: taskDto.imageId,
      createdAt: taskDto.createdAt,
      modifiedAt: taskDto.modifiedAt,
    };

    if (!isEmptyTaskDescription(taskDto.description)) {
      task.description = taskDto.description;
    }

    return task;
  }

  public static toDto(task: Task): TaskDTO {
    if (!task) {
      throw new Error(
        'An error occurred while converting the task to a DTO: the passed task object is NULL or undefined.',
      );
    }

    const dto: TaskDTO = {
      id: task.id,
      userId: task.userId,
      type: task.type,
      title: task.title,
      status: task.status,
      imageId: task.imageId,
      createdAt: task.createdAt,
      modifiedAt: task.modifiedAt,
    };

    if (!isEmptyTaskDescription(task.description)) {
      dto.description = task.description;
    }

    return dto;
  }
}
