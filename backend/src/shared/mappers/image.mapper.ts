import { Result } from '../core/result.js';
import { Image } from '../domain/models/image.js';
import { UniqueEntityID } from '../domain/UniqueEntityID.js';
import { IImagePersistent } from '../infra/database/mongodb/image.model.js';

export class ImageMapper {
  public static toDomain(raw: IImagePersistent): Result<Image, never> {
    const image = Image.create(
      {
        imageId: raw.imageId,
        userId: raw.userId,
        storageType: raw.storageType,
        fileId: raw.fileId,
      },
      new UniqueEntityID(raw._id),
    );

    return image;
  }

  public static toPersistence(image: Image): IImagePersistent {
    return {
      _id: image.id.toString(),
      imageId: image.imageId,
      userId: image.userId,
      storageType: image.storageType,
      fileId: image.fileId,
    };
  }
}
