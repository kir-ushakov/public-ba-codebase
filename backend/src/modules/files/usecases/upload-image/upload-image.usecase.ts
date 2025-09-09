import path from 'path';
import fs from 'fs';

import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/result.js';
import { UploadImageError, UploadImageErrors } from './upload-image.errors.js';
import { GoogleDriveService } from '././../../../integrations/google/services/google-drive.service.js';
import { User } from '../../../../shared/domain/models/user.js';
import { UploadImageRequest } from './upload-image.request.js';
import { UploadImageResponse } from './upload-image.response.js';
import { config } from '../../../../config/index.js';

export type UploadImageResult = Result<UploadImageResponse | never, UploadImageError>;

export class UploadImageUsecase implements UseCase<UploadImageRequest, Promise<UploadImageResult>> {
  private googleDriveService: GoogleDriveService;
  private allowedTypes = ['png', 'jpeg', 'jpg'];

  constructor(googleDriveService: GoogleDriveService) {
    this.googleDriveService = googleDriveService;
  }

  public async execute(req: UploadImageRequest, user: User): Promise<UploadImageResult> {
    const file: Express.Multer.File = req.file;
    const userId: string = user.id.toString();

    const prepareResult = await this.prepareAndValidateFile(file, userId);
    if (prepareResult.isFailure) {
      return prepareResult as Result<never, UploadImageError>;
    }

    const { pathToFile, fileType } = prepareResult.getValue();

    try {
      const fileId: string = await this.googleDriveService.uploadFile(user, pathToFile);

      return Result.ok<UploadImageResponse, never>({
        fileId,
        extension: fileType,
      });
    } catch (error) {
      // TODO: handele error properly (as service error)
      // TICKET: https://brainas.atlassian.net/browse/BA-218
      console.error('Error uploading file to Google Drive:', error);
      return new UploadImageErrors.UploadToGoogleDriveFailed();
    }
  }

  private async prepareAndValidateFile(
    file: Express.Multer.File,
    userId: string
  ): Promise<Result<{ pathToFile: string; fileType: string }, UploadImageError>> {
    const tempPath = file.path;
    const originalname = file.originalname;
    const userUploadDir = `${config.paths.uploadTempDir}/${userId}`;
    const pathToFile = `${userUploadDir}/${originalname}`;

    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }

    const fileType = path.extname(originalname).toLowerCase().replace('.', '');
    if (!this.allowedTypes.includes(fileType)) {
      return await new Promise<Result<never, UploadImageError>>((resolve, reject) => {
        fs.unlink(tempPath, err => {
          if (err) reject(err);
          resolve(new UploadImageErrors.NotSupportedTypeError(fileType));
        });
      });
    }

    await new Promise<void>((resolve, reject) => {
      fs.rename(tempPath, pathToFile, err => {
        if (err) reject(err);
        resolve();
      });
    });

    return Result.ok({ pathToFile, fileType });
  }
}
