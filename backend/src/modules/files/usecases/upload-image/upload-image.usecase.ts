import path from 'path';
import { promises as fsp } from 'fs';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { EUploadImageUseCaseError, UploadImageErrors } from './upload-image.errors.js';
import { config } from '../../../../config/index.js';
import { Image } from '../../../../shared/domain/models/image.js';
import { ImageRepoService } from '../../../../shared/repo/image-repo.service.js';
import { ImageResizeService } from '../../services/image-resize.service.js';
import { IImageStorage } from '../../services/image-storage/image-storage.interface.js';
import { isSafeImageId } from '../../services/image-storage/image-storage-path.function.js';
import { ALLOWED_IMAGE_UPLOAD_EXTENSIONS, STORED_IMAGE_FORMAT } from '../../config.js';

export type UploadImageParams = {
  imageId: string;
  file: Express.Multer.File;
  userId: string;
};

export type UploadImageResult = Result<{ imageId: string }, UseCaseError<EUploadImageUseCaseError>>;

export class UploadImageUsecase implements UseCase<UploadImageParams, Promise<UploadImageResult>> {
  constructor(
    private readonly imageStorage: IImageStorage,
    private readonly imageRepoService: ImageRepoService,
    private readonly imageResizeService: ImageResizeService,
  ) {}

  public async execute(params: UploadImageParams): Promise<UploadImageResult> {
    const { imageId, userId } = params;
    const multerTempPath = params.file.path;
    const extension = path.extname(params.file.originalname).toLowerCase().replace('.', '');
    let stagedPath: string | undefined;
    let preparedPath: string | undefined;

    try {
      if (!isSafeImageId(imageId)) {
        return UploadImageErrors.InvalidImageId();
      }
      if (!ALLOWED_IMAGE_UPLOAD_EXTENSIONS.includes(extension)) {
        return UploadImageErrors.NotSupportedTypeError(extension);
      }

      stagedPath = path.join(config.paths.uploadTempDir, userId, `${imageId}.${extension}`);
      preparedPath = await this.prepareForStore(multerTempPath, stagedPath);

      const fileIdOrError = await this.imageStorage.put({
        userId,
        imageId,
        sourcePath: preparedPath,
        extension: STORED_IMAGE_FORMAT.extension,
      });
      if (fileIdOrError.isFailure) {
        return UploadImageErrors.StoreImageFailed(fileIdOrError.error);
      }

      const image = Image.create({
        imageId,
        userId,
        storageType: 'local',
        fileId: fileIdOrError.getValue(),
        mimeType: STORED_IMAGE_FORMAT.mimeType,
      }).getValue();
      await this.imageRepoService.save(image);

      return Result.ok<{ imageId: string }>({ imageId });
    } finally {
      await removeLeftovers([multerTempPath, stagedPath, preparedPath]);
    }
  }

  private async prepareForStore(multerTempPath: string, stagedPath: string): Promise<string> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- staged path built from userId and validated imageId
    await fsp.mkdir(path.dirname(stagedPath), { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- multer temp path into the staged path
    await fsp.rename(multerTempPath, stagedPath);
    return this.imageResizeService.prepareForStore(stagedPath);
  }
}

/** A successful put() has already moved the prepared file, so only failures leave anything. */
async function removeLeftovers(paths: (string | undefined)[]): Promise<void> {
  await Promise.all(
    paths
      .filter((filePath): filePath is string => filePath !== undefined)
      .map(filePath => fsp.rm(filePath, { force: true })),
  );
}
