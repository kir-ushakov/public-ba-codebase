import { Readable } from 'stream';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { ImageResizeService } from '../../services/image-resize.service.js';
import { ImageRepoService } from '../../../../shared/repo/image-repo.service.js';
import { Image } from '../../../../shared/domain/models/image.js';
import {
  IImageStorage,
  StoredImageFile,
} from '../../services/image-storage/image-storage.interface.js';
import { EImageStorageError } from '../../services/image-storage/image-storage.error.js';
import { GetImageErrors, GetImageErrorCode } from './get-image.errors.js';

export type GetImageRequest = {
  imageId: string;
  userId: string;
  imageWidth?: number;
};

export type ImageFile = {
  data: Readable;
  contentType: string;
  /** Unknown once the image is resized on the fly. */
  contentLength?: number;
  etag: string;
};

export type GetImageResult = Result<ImageFile, UseCaseError<GetImageErrorCode>>;

export class GetImageUsecase implements UseCase<GetImageRequest, Promise<GetImageResult>> {
  constructor(
    private readonly localImageStorage: IImageStorage,
    private readonly imageResizeService: ImageResizeService,
    private readonly imageRepoService: ImageRepoService,
  ) {}

  public async execute(req: GetImageRequest): Promise<GetImageResult> {
    const imageOrError = await this.imageRepoService.getUserImageById(req.userId, req.imageId);
    if (imageOrError.isFailure) {
      return GetImageErrors.ImageNotFoundError(imageOrError.error);
    }
    const image = imageOrError.getValue();

    if (image.storageType !== 'local') {
      return GetImageErrors.ImageReadFailed();
    }

    const storedOrError = await this.localImageStorage.get(image.fileId);
    if (storedOrError.isFailure) {
      return storedOrError.error.code === EImageStorageError.FileMissing
        ? GetImageErrors.ImageFileMissing(storedOrError.error)
        : GetImageErrors.ImageReadFailed(storedOrError.error);
    }
    const stored = storedOrError.getValue();
    const etag = buildEtag(stored, req.imageWidth);

    if (req.imageWidth) {
      const { resized, contentType } = await this.imageResizeService.resizeImage(
        stored.data,
        req.imageWidth,
      );
      // The caller only sees `resized`; destroying it must also release the file handle.
      resized.once('close', () => stored.data.destroy());
      return Result.ok({ data: resized, contentType, etag });
    }

    return Result.ok(toImageFile(image, stored, etag));
  }
}

function toImageFile(image: Image, stored: StoredImageFile, etag: string): ImageFile {
  return {
    data: stored.data,
    contentType: image.mimeType,
    contentLength: stored.sizeBytes,
    etag,
  };
}

/** Weak: a resize is re-encoded on every request and need not be byte-identical. */
function buildEtag(stored: StoredImageFile, width: number | undefined): string {
  const version = `${stored.sizeBytes.toString(16)}-${stored.modifiedAt.getTime().toString(16)}`;
  return `W/"${version}-w${width ?? 0}"`;
}
