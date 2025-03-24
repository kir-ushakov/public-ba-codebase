import { Readable } from 'stream';
import { GaxiosResponse } from 'googleapis-common';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { GoogleDriveService } from '././../../../integrations/google/services/google-drive.service.js';
import { ImageResizeService } from '../../services/image-resize.service.js'
import { User } from '../../../../shared/domain/models/user.js';

export type GetImageRequest = {
  fileId: string;
  user: User;
  imageWidth?: number;
};

export type GetImageResult = Result<GaxiosResponse<Readable> | UseCaseError>;

export class GetImageUsecase
  implements UseCase<GetImageRequest, Promise<GetImageResult>> {

  constructor(
    private readonly _googleDriveService: GoogleDriveService, 
    private readonly _imageResizeService: ImageResizeService) {
  }

  public async execute(req: GetImageRequest): Promise<GetImageResult> {
    const fileId: string = req.fileId;
    const user: User = req.user;

    let file: GaxiosResponse<Readable> =
      await this._googleDriveService.getImageById(user, fileId);
      if(req.imageWidth) {
        file = await this._imageResizeService.resizeImage(file, req.imageWidth);
      }
      return Result.ok<GaxiosResponse<Readable>>(file);
  }
}
