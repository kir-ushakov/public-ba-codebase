import { ServiceError } from '../core/service-error.js';
import { serviceFail } from '../core/service-fail.factory.js';
import { Image } from '../domain/models/image.js';
import { IImagePersistent, ImageDocument } from '../infra/database/mongodb/image.model.js';
import { IDbModels } from '../infra/database/mongodb/index.js';
import { ImageMapper } from '../mappers/image.mapper.js';

export enum EImageRepoServiceError {
  UserImageNotFound = 'IMAGE_REPO_SERVICE_ERROR__USER_IMAGE_NOT_FOUND',
}

export class ImageRepoService {
  private _models: IDbModels;

  constructor(models: IDbModels) {
    this._models = models;
  }

  public async create(client: Image): Promise<ImageDocument> {
    const imageModel = this._models.ImageModel;

    const clientData: IImagePersistent = ImageMapper.toPersistence(client);
    const newClient = await imageModel.create(clientData);
    return newClient;
  }

  public async getUserTaskById(
    userId: string,
    imageId: string,
  ): Promise<Image | ServiceError<EImageRepoServiceError>> {
    const imageModel = this._models.ImageModel;

    const imageDocument = await imageModel.findOne({ userId, imageId });
    if (!imageDocument)
      return serviceFail<EImageRepoServiceError>(
        `The image with id = "${imageId}" for user with id = ${userId} doesn't exist`,
        EImageRepoServiceError.UserImageNotFound,
      );
    
    const imageResult = ImageMapper.toDomain(imageDocument);
    if (imageResult.isFailure()) {
      return imageResult.getError();
    }
    return imageResult.getValue();
  }

  public async save(image: Image): Promise<ImageDocument> {
    const imageModel = this._models.ImageModel;

    const imagePersistent = ImageMapper.toPersistence(image);
    const updatedImage = await imageModel.findOneAndUpdate(
      { imageId: image.imageId },
      imagePersistent,
      {
        new: true,
        useFindAndModify: false,
      },
    );
    if (!updatedImage) throw new Error(`Image with id ${image.imageId} not found`);
    return updatedImage;
  }
}