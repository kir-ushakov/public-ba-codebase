import path from 'path';
import fs from 'fs';

import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/Result.js';
import { UploadImageErrors } from './upload-image.errors.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { GoogleDriveService } from '././../../../integrations/google/services/google-drive.service.js';
import { User } from '../../../../shared/domain/models/user.js';
import { UploadImageRequest } from './upload-image.request.js';
import { UploadImageResponse } from './upload-image.response.js';

export type UploadImageResult = Result<UploadImageResponse | UseCaseError>;

export class UploadImageUsecase
  implements UseCase<UploadImageRequest, Promise<UploadImageResult>>
{
  private googleDriveService: GoogleDriveService;
  private allowedTypes = ['png', 'jpeg', 'jpg'];

  constructor(googleDriveService: GoogleDriveService) {
    this.googleDriveService = googleDriveService;
  }

  public async execute(
    req: UploadImageRequest,
    user: User
  ): Promise<UploadImageResult> {
    const file: Express.Multer.File = req.file;
    const userId: string = user.id.toString();
    const tempPath = file.path;
    const originalname = req.file.originalname;
    const targetDir = `${process.env.FILES_UPLOAD_PATH}/uploads/${userId}`;
    const targetPath = `${targetDir}/${originalname}`;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileType = path
      .extname(req.file.originalname)
      .toLowerCase()
      .replace('.', '');
    if (!this.allowedTypes.includes(fileType)) {
      return await new Promise<Result<UseCaseError>>((resolve, reject) => {
        fs.unlink(tempPath, (err) => {
          if (err) reject(err);
          resolve(new UploadImageErrors.NotSupportedTypeError(fileType));
        });
      });
    }

    await new Promise<void>((resolve, reject) => {
      fs.rename(tempPath, targetPath, (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    const fileId: string = await this.googleDriveService.uploadFile(
      user,
      targetPath
    );

    return Result.ok<UploadImageResponse>({
      fileId,
      extension: fileType,
    });
  }
}
