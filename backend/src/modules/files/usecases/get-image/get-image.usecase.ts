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

    /**
     * #NOTE:
     * Retrieve an image by its ID from Google Drive.
     */
    let file: GaxiosResponse<Readable> =
      await this._googleDriveService.getImageById(user, fileId);
    
    /**
     * #NOTE:
     * If a width is specified, the Image Resize Service resizes the image before returning it.
     */
    if(req.imageWidth) {
      file = await this.resize(file, req.imageWidth);
    }
    return Result.ok<GaxiosResponse<Readable>>(file);
  }

  private async resize(file: GaxiosResponse<Readable>, width: number) {
    /**
     * #NOTE:
     * The Resize Service operates on a Readable Stream, modifying the image on-the-fly 
     * and returning a resized stream along with the correct content type. 
     * This ensures efficient processing without loading the entire image into memory.
     */
    const resizeResult: {resized: Readable, contentType: string} 
      = await this._imageResizeService.resizeImage(file.data, width);
    file.data = resizeResult.resized;
    file.headers = { 
      ...file.headers,
      'content-type': resizeResult.contentType
    };
    delete file.headers["content-length"];

    return file;
  }
}
