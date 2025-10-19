import path from 'path';
import { promises as fsp } from 'fs';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/result.js';
import { UploadImageError, UploadImageErrors } from './upload-image.errors.js';
import { GoogleDriveService } from '././../../../integrations/google/services/google-drive.service.js';
import { User } from '../../../../shared/domain/models/user.js';
import { config } from '../../../../config/index.js';
import { Image } from '../../../../shared/domain/models/image.js';
import { ImageRepoService } from '../../../../shared/repo/image-repo.service.js';
import { ImageResizeService } from '../../services/image-resize.service.js';

const MAX_IMAGE_STORE_SIZE = 1000; // TODO: move to config

export type UploadImageParams = {
  imageId: string;
  file: Express.Multer.File;
  userId: string;
};

export type UploadImageResult = Result<{ imageId: string }, UploadImageError>;

export class UploadImageUsecase implements UseCase<UploadImageParams, Promise<UploadImageResult>> {
  private googleDriveService: GoogleDriveService;
  private readonly imageRepoService: ImageRepoService;
  private readonly imageResizeService: ImageResizeService;
  private allowedTypes = ['png', 'jpeg', 'jpg']; // TODO: move to responsible service

  constructor(
    googleDriveService: GoogleDriveService,
    imageRepoService: ImageRepoService,
    imageResizeService: ImageResizeService,
  ) {
    this.googleDriveService = googleDriveService;
    this.imageRepoService = imageRepoService;
    this.imageResizeService = imageResizeService;
  }

  public async execute(params: UploadImageParams, user: User): Promise<UploadImageResult> {
    const userId: string = params.userId;

    const pathToFileOrError = await this.prepareLocalFile(params, userId);
    if (pathToFileOrError.isFailure) {
      return Result.fail<never, UploadImageError>(pathToFileOrError.error);
    }
    const { pathToFile } = pathToFileOrError.getValue();

    try {
      const fileId: string = await this.googleDriveService.uploadFile(user, pathToFile);

      const imageOrError = Image.create({
        imageId: params.imageId,
        storageType: 'googleDrive',
        fileId,
        userId,
      });
  
      // TODO: handle potential error properly (as domain error)
      await this.imageRepoService.create(imageOrError.getValue());

      // Return response with imageId confirmation
      const response = {
        imageId: params.imageId,
      };

      return Result.ok<{ imageId: string }, never>(response);
    } catch (error) {
      // TODO: handele error properly (as service error)
      // TICKET: https://brainas.atlassian.net/browse/BA-218
      console.error('Error uploading file to Google Drive:', error);
      return new UploadImageErrors.UploadToGoogleDriveFailed();
    }
  }

  private async prepareLocalFile(
    req: UploadImageParams,
    userId: string,
  ): Promise<Result<{ pathToFile: string; extension: string }, UploadImageError>> {
    const tempPath = req.file.path;
    const originalname = req.file.originalname;
    const userUploadDir = `${config.paths.uploadTempDir}/${userId}`;
    const pathToFile = `${userUploadDir}/${originalname}`;

    await fsp.mkdir(userUploadDir, { recursive: true });

    const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    if (!this.allowedTypes.includes(fileType)) {
      await fsp.unlink(tempPath);
      return new UploadImageErrors.NotSupportedTypeError(fileType);
    }

    await fsp.rename(tempPath, pathToFile);

    // Resize the image to allowed maximum width
    await this.imageResizeService.resizeImageToMaxSize(pathToFile, MAX_IMAGE_STORE_SIZE);

    return Result.ok<{ pathToFile: string; extension: string }, never>({
      pathToFile,
      extension: fileType,
    });
  }

}
