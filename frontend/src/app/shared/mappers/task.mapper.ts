import { TaskDTO } from '@brainassistant/contracts';
import { Task } from '../models/task.model';
import { isEmptyTaskDescription } from '../helpers/is-empty-task-description.function';
import { normalizeTaskRecord } from '../helpers/task-conditions.function';

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

    if (taskDto.images?.length) {
      task.images = taskDto.images;
    }

    if (!isEmptyTaskDescription(taskDto.description)) {
      task.description = taskDto.description;
    }

    if (taskDto.checklist) {
      task.checklist = taskDto.checklist;
    }

    if (taskDto.audioAttachments) {
      task.audioAttachments = taskDto.audioAttachments;
    }

    if (taskDto.tagIds) {
      task.tagIds = taskDto.tagIds;
    }

    return normalizeTaskRecord(task);
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

    if (task.images?.length) {
      dto.images = task.images;
    }

    if (!isEmptyTaskDescription(task.description)) {
      dto.description = task.description;
    }

    if (task.checklist) {
      dto.checklist = task.checklist;
    }

    if (task.audioAttachments) {
      dto.audioAttachments = task.audioAttachments;
    }

    if (task.tagIds) {
      dto.tagIds = task.tagIds;
    }

    if (task.conditions?.length) {
      dto.conditions = task.conditions;
    }

    return dto;
  }
}
