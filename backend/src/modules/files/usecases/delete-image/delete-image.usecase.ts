import { EDeleteImageUseCaseError } from '@brainassistant/contracts';
import { Result } from '../../../../shared/core/result.js';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { ImageRepoService } from '../../../../shared/repo/image-repo.service.js';
import { IImageStorage } from '../../services/image-storage/image-storage.interface.js';
import { isSafeImageId } from '../../services/image-storage/image-storage-path.function.js';
import { DeleteImageErrors } from './delete-image.errors.js';

export type DeleteImageParams = {
  imageId: string;
  userId: string;
};

export class DeleteImageUsecase
  implements
    UseCase<DeleteImageParams, Promise<Result<void, UseCaseError<EDeleteImageUseCaseError>>>>
{
  constructor(
    private readonly imageRepo: ImageRepoService,
    private readonly storage: IImageStorage,
  ) {}

  public async execute(
    params: DeleteImageParams,
  ): Promise<Result<void, UseCaseError<EDeleteImageUseCaseError>>> {
    if (!isSafeImageId(params.imageId)) {
      return DeleteImageErrors.InvalidImageId();
    }

    const images = await this.imageRepo.findUserImagesByIds(params.userId, [params.imageId]);
    const image = images[0];
    if (!image || image.storageType !== 'local') {
      return Result.ok(undefined);
    }

    if (image.fileId) {
      const removed = await this.storage.delete(image.fileId);
      if (removed.isFailure) {
        return DeleteImageErrors.DeleteFailed(removed.error);
      }
    }
    await this.imageRepo.deleteUserImages(params.userId, [params.imageId]);
    return Result.ok(undefined);
  }
}
