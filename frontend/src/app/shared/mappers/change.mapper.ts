import { TaskDTO, TagDTO, ChangeDTO, ChangeableObjectDTO } from '../dto/';
import { Tag } from '../models';
import {
  ChangeableObject,
  Change,
  EChangedEntity,
} from '../models/change.model';
import { Task } from '../models/task.model';
import { TagMapper } from './tag.mapper';
import { TasksMapper } from './task.mapper';

/**
 * #NOTE
 * The ChangeMapper class is an example of a more complex Mapper
 * that uses other Mappers to convert ChangeableObjectDTOs to models
 * depending on their types.
 */
export class ChangeMapper {
  static ERROR_MESSAGES = {
    INVALID_TYPE: 'Type of change not valid',
  };

  public static toModel(changeDto: ChangeDTO): Change {
    let model: ChangeableObject | null = null;

    switch (changeDto.entity) {
      case EChangedEntity.Task:
        model = TasksMapper.toModel(changeDto.object as TaskDTO);
        break;

      case EChangedEntity.Tag:
        model = TagMapper.toModel(changeDto.object as TagDTO);
        break;
      default:
        console.log(ChangeMapper.ERROR_MESSAGES.INVALID_TYPE);
        throw new Error(ChangeMapper.ERROR_MESSAGES.INVALID_TYPE);
    }

    return {
      entity: changeDto.entity as EChangedEntity,
      action: changeDto.action,
      object: model,
    };
  }

  public static toDto(change: Change): ChangeDTO {
    let model: ChangeableObjectDTO | null = null;

    switch (change.entity) {
      case EChangedEntity.Task:
        model = TasksMapper.toDto(change.object as Task);
        break;

      case EChangedEntity.Tag:
        model = TagMapper.toDto(change.object as Tag);
        break;
      default:
        console.log(ChangeMapper.ERROR_MESSAGES.INVALID_TYPE);
        throw new Error(ChangeMapper.ERROR_MESSAGES.INVALID_TYPE);
    }

    return {
      entity: change.entity,
      object: model,
    } as ChangeDTO;
  }
}
