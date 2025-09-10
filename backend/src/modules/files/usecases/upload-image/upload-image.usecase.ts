import path from 'path';
import { promises as fsp } from 'fs';

import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/result.js';
import { UploadImageError, UploadImageErrors } from './upload-image.errors.js';
import { GoogleDriveService } from '././../../../integrations/google/services/google-drive.service.js';
import { User } from '../../../../shared/domain/models/user.js';
import { UploadImageRequest } from './upload-image.request.js';
import { UploadImageResponse } from './upload-image.response.js';
import { config } from '../../../../config/index.js';
import { Image } from '../../../../shared/domain/models/image.js';
import { ImageRepo } from '../../../../shared/repo/image.repo.js';

export type UploadImageResult = Result<UploadImageResponse | never, UploadImageError>;

export class UploadImageUsecase implements UseCase<UploadImageRequest, Promise<UploadImageResult>> {
  private googleDriveService: GoogleDriveService;
  private readonly imageRepo: ImageRepo;

  private allowedTypes = ['png', 'jpeg', 'jpg'];

  constructor(googleDriveService: GoogleDriveService, imageRepo: ImageRepo) {
    this.googleDriveService = googleDriveService;
    this.imageRepo = imageRepo;
  }

  public async execute(req: UploadImageRequest, user: User): Promise<UploadImageResult> {
    const userId: string = user.id.toString();

    const pathToFileOrError = await this.prepareLocalFile(req, userId);
    if (pathToFileOrError.isFailure) {
      return Result.fail<never, UploadImageError>(pathToFileOrError.error);
    }
    const { pathToFile, extension } = pathToFileOrError.getValue();

    try {
      const fileId: string = await this.googleDriveService.uploadFile(user, pathToFile);

      await this.saveImageToDB(req.imageId, fileId);

      return Result.ok<UploadImageResponse, never>();
    } catch (error) {
      // TODO: handele error properly (as service error)
      // TICKET: https://brainas.atlassian.net/browse/BA-218
      console.error('Error uploading file to Google Drive:', error);
      return new UploadImageErrors.UploadToGoogleDriveFailed();
    }
  }

  private async prepareLocalFile(
    req: UploadImageRequest,
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

    return Result.ok<{ pathToFile: string; extension: string }, never>({
      pathToFile,
      extension: fileType,
    });
  }

  private async saveImageToDB(imageId: string, fileId: string): Promise<void> {
    const imageOrError = Image.create({
      imageId: imageId,
      storageType: 'googleDrive',
      fileId,
    });

    await this.imageRepo.create(imageOrError.getValue());
  }
}
