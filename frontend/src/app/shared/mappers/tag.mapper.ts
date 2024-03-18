import { TagDTO } from '../dto';
import { ETagType, Tag } from '../models';

export class TagMapper {
  public static toModel(tagDto: TagDTO): Tag {
    return {
      id: tagDto.id,
      /**
       * #NOTE
       * Here we see that the DTO is not always identical to the model.
       * and we need to convert  boolean to ETagType
       */
      type: tagDto.isCategory ? ETagType.CATEGORY : ETagType.REGULAR,
      name: tagDto.name,
      color: tagDto.color,
      createdAt: tagDto.createdAt,
      modifiedAt: tagDto.modifiedAt,
    } as Tag;
  }

  public static toDto(tag: Tag): TagDTO {
    return {
      id: tag.id,
      isCategory: tag.type === ETagType.CATEGORY ? true : false,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt,
      modifiedAt: tag.modifiedAt,
    } as TagDTO;
  }
}
