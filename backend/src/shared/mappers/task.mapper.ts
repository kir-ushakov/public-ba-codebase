import { Task, TaskPresitant } from '../domain/models/task.js';
import {
  TaskDTO,
  ETaskStatus,
  ETaskType,
  type TaskDescriptionDoc,
} from '@brainassistant/contracts';
import { UniqueEntityID } from '../domain/UniqueEntityID.js';
import { TaskDescription } from '../domain/values/task/task-description.js';
import { projectTaskType, storedTaskConditions } from '../domain/models/task-conditions.js';

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
      checklist,
      tagIds,
      _id,
      createdAt,
      modifiedAt,
      conditions,
    } = raw;

    const storedConditions = storedTaskConditions(status, type, conditions);

    return Task.reconstitute(
      {
        userId,
        type: storedConditions ? projectTaskType(storedConditions) : (type as ETaskType),
        title: title ?? '',
        status: status as ETaskStatus,
        conditions: storedConditions,
        imageId,
        images: TaskMapper.definedImages(images),
        description: TaskMapper.toValidDescription(description),
        checklist,
        tagIds: tagIds ?? [],
        createdAt,
        modifiedAt,
      },
      new UniqueEntityID(_id),
    );
  }

  public static toPersistence(task: Task): TaskPresitant {
    const {
      id,
      userId,
      type,
      title,
      status,
      imageId,
      images,
      description,
      checklist,
      tagIds,
      createdAt,
      modifiedAt,
      conditions,
    } = task;

    const persisted: TaskPresitant = {
      _id: id.toString(),
      userId,
      type,
      title,
      status,
      imageId,
      tagIds,
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

    if (checklist?.length) {
      persisted.checklist = checklist;
    }

    if (conditions?.length) {
      persisted.conditions = conditions;
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
      tagIds: task.tagIds,
      createdAt: task.createdAt.toISOString(),
      modifiedAt: task.modifiedAt.toISOString(),
    };

    if (task.conditions?.length) {
      dto.conditions = task.conditions;
      dto.type = projectTaskType(task.conditions);
    }

    const definedImages = TaskMapper.definedImages(task.images);
    if (definedImages) {
      dto.images = definedImages;
    }

    if (task.description !== undefined) {
      dto.description = task.description;
    }

    if (task.checklist?.length) {
      dto.checklist = task.checklist;
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
