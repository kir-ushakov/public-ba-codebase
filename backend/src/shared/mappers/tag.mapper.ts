import { canonicalTagColor, TagConst, TagDTO } from '@brainassistant/contracts';
import { Tag, TagPersistent } from '../domain/models/tag.js';
import { UniqueEntityID } from '../domain/UniqueEntityID.js';

export class TagMapper {
  public static toDomain(raw: TagPersistent): Tag {
    const { userId, name, color, isPinned, _id, createdAt, modifiedAt } = raw;

    return Tag.reconstitute(
      {
        userId,
        name: name ?? '',
        color: canonicalTagColor(color) ?? TagConst.DEFAULT_COLOR,
        isPinned: isPinned === true,
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
      isPinned: tag.isPinned,
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
      isPinned: tag.isPinned,
      createdAt: tag.createdAt.toISOString(),
      modifiedAt: tag.modifiedAt.toISOString(),
    };
  }
}
