import { TagDTO } from '@brainassistant/contracts';
import { Tag, TagPersistent } from '../domain/models/tag.js';
import { UniqueEntityID } from '../domain/UniqueEntityID.js';

export class TagMapper {
  public static toDomain(raw: TagPersistent): Tag {
    const { userId, name, color, _id, createdAt, modifiedAt } = raw;

    return Tag.reconstitute(
      {
        userId,
        name: name ?? '',
        color: color ?? '',
        createdAt,
        modifiedAt,
      },
      new UniqueEntityID(_id),
    );
  }

  public static toPersistence(tag: Tag): TagPersistent {
    return {
      _id: tag.id.toString(),
      userId: tag.userId,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
      modifiedAt: tag.modifiedAt,
    };
  }

  public static toDTO(tag: Tag): TagDTO {
    return {
      id: tag.id.toString(),
      userId: tag.userId,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt.toISOString(),
      modifiedAt: tag.modifiedAt.toISOString(),
    };
  }
}
