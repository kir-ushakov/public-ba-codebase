import { TaskDTO } from '../dto/task.dto';
import { Task, ETaskStatus, ETaskType } from '../models/task.model';

export class TasksMapper {
  public static toModel(taskDto: TaskDTO): Task {
    return {
      id: taskDto.id,
      userId: taskDto.userId,
      type: taskDto.type as ETaskType,
      title: taskDto.title,
      status: taskDto.status as ETaskStatus,
      imageId: taskDto.imageId,
      createdAt: taskDto.createdAt,
      modifiedAt: taskDto.modifiedAt,
    } as Task;
  }

  public static toDto(task: Task): TaskDTO {
    if (!task) {
      throw new Error(
        'An error occurred while converting the task to a DTO: the passed task object is NULL or undefined.',
      );
    }

    return {
      id: task.id,
      userId: task.userId,
      type: task.type,
      title: task.title,
      status: task.status,
      imageUri: task.imageId,
      createdAt: task.createdAt,
      modifiedAt: task.modifiedAt,
    } as TaskDTO;
  }
}
