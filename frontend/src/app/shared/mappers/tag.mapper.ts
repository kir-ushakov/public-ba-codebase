import { TagDTO } from '@brainassistant/contracts';
import { Tag } from '../models';

export class TagMapper {
  public static toModel(tagDto: TagDTO): Tag {
    return {
      id: tagDto.id,
      userId: tagDto.userId,
      name: tagDto.name,
      color: tagDto.color,
      createdAt: tagDto.createdAt,
      modifiedAt: tagDto.modifiedAt,
    };
  }

  public static toDto(tag: Tag): TagDTO {
    return {
      id: tag.id,
      userId: tag.userId,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
      modifiedAt: tag.modifiedAt,
    };
  }
}
