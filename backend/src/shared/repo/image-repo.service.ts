import { EImageRepoServiceError } from '@brainassistant/contracts';
import { Result } from '../core/result.js';
import { ServiceError } from '../core/service-error.js';
import { serviceFail } from '../core/service-fail.factory.js';
import { Image } from '../domain/models/image.js';
import { IImagePersistent } from '../infra/database/mongodb/image.model.js';
import { IDbModels } from '../infra/database/mongodb/index.js';
import { ImageMapper } from '../mappers/image.mapper.js';

export { EImageRepoServiceError };

export class ImageRepoService {
  private _models: IDbModels;

  constructor(models: IDbModels) {
    this._models = models;
  }

  /** Upsert by owner + imageId, so a retried upload of the same image is not a duplicate. */
  public async save(image: Image): Promise<void> {
    const imageModel = this._models.ImageModel;

    const { _id, ...fields }: IImagePersistent = ImageMapper.toPersistence(image);
    await imageModel.updateOne(
      { userId: image.userId, imageId: image.imageId },
      { $set: fields, $setOnInsert: { _id } },
      { upsert: true },
    );
  }

  public async getUserImageById(
    userId: string,
    imageId: string,
  ): Promise<Result<Image, ServiceError<EImageRepoServiceError>>> {
    const imageModel = this._models.ImageModel;

    const imageDocument = await imageModel.findOne({ userId, imageId });
    if (!imageDocument)
      return serviceFail<EImageRepoServiceError>(
        `The image with id = "${imageId}" for user with id = ${userId} doesn't exist`,
        EImageRepoServiceError.UserImageNotFound,
      );

    return Result.ok<Image, ServiceError<EImageRepoServiceError>>(
      ImageMapper.toDomain(imageDocument).getValue(),
    );
  }
}
