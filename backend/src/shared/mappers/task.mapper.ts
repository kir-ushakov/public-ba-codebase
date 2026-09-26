import { Task, TaskPresitant } from '../domain/models/task.js';
import {
  TaskDTO,
  ETaskStatus,
  ETaskType,
  type TaskDescriptionDoc,
} from '@brainassistant/contracts';
import { UniqueEntityID } from '../domain/UniqueEntityID.js';
import { TaskDescription } from '../domain/values/task/task-description.js';

export class TaskMapper {
  public static toDomain(raw: TaskPresitant): Task {
    const {
      userId,
      type,
      title,
      status,
      imageId,
      images,
      description,
      _id,
      createdAt,
      modifiedAt,
    } = raw;

    return Task.reconstitute(
      {
        userId,
        type: type as ETaskType,
        title: title ?? '',
        status: status as ETaskStatus,
        imageId,
        images: TaskMapper.definedImages(images),
        description: TaskMapper.toValidDescription(description),
        createdAt,
        modifiedAt,
      },
      new UniqueEntityID(_id),
    );
  }

  public static toPersistence(task: Task): TaskPresitant {
    const { id, userId, type, title, status, imageId, images, description, createdAt, modifiedAt } =
      task;

    const persisted: TaskPresitant = {
      _id: id.toString(),
      userId,
      type,
      title,
      status,
      imageId,
      createdAt,
      modifiedAt,
    };

    const definedImages = TaskMapper.definedImages(images);
    if (definedImages) {
      persisted.images = definedImages;
    }

    if (description !== undefined) {
      persisted.description = description;
    }

    return persisted;
  }

  public static toDTO(task: Task): TaskDTO {
    const dto: TaskDTO = {
      id: task.id.toString(),
      userId: task.userId,
      type: task.type,
      title: task.title,
      status: task.status,
      imageId: task.imageId,
      createdAt: task.createdAt.toISOString(),
      modifiedAt: task.modifiedAt.toISOString(),
    };

    const definedImages = TaskMapper.definedImages(task.images);
    if (definedImages) {
      dto.images = definedImages;
    }

    if (task.description !== undefined) {
      dto.description = task.description;
    }

    return dto;
  }

  private static definedImages(images: string[] | undefined): string[] | undefined {
    const ids = images?.filter(id => id.length > 0);
    return ids?.length ? ids : undefined;
  }

  private static toValidDescription(
    raw: TaskDescriptionDoc | undefined,
  ): TaskDescriptionDoc | undefined {
    if (raw === undefined) {
      return undefined;
    }

    const created = TaskDescription.create(raw);
    if (created.isFailure) {
      return undefined;
    }

    const description = created.getValue();
    if (description.isEmpty()) {
      return undefined;
    }

    return description.toJSON();
  }
}
