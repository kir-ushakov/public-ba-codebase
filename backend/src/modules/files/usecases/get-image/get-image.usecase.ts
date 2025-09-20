import { Readable } from 'stream';
import { GaxiosResponse } from 'googleapis-common';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { GoogleDriveService } from '././../../../integrations/google/services/google-drive.service.js';
import { ImageResizeService } from '../../services/image-resize.service.js';
import { User } from '../../../../shared/domain/models/user.js';
import { ImageRepoService } from '../../../../shared/repo/image-repo.service.js';
import { GetImageErrors } from './get-image.errors.js';

export type GetImageRequest = {
  imageId: string;
  user: User;
  imageWidth?: number;
};

export type GetImageResult = Result<GaxiosResponse<Readable> | never, UseCaseError<string>>;

/**
 * GetImageUsecase handles image retrieval from Google Drive with optional resizing.
 * 
 * Performance logging output examples:
 * - Google Drive retrieval: { imageId, fileId, retrievalTimeMs: 450, contentLength: "2.34 MB", contentType: "image/jpeg" }
 * - Image resize: { resizeTimeMs: 120, targetWidth: 500, originalSize: "2.34 MB" }
 */
export class GetImageUsecase implements UseCase<GetImageRequest, Promise<GetImageResult>> {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly imageResizeService: ImageResizeService,
    private readonly imageRepoService: ImageRepoService,
    private readonly logger = console,
  ) {}

  public async execute(req: GetImageRequest): Promise<GetImageResult> {
    const user = req.user;
    const userId = user.id.toString();
    const imageId = req.imageId;

    const imageOrError = await this.imageRepoService.getUserImageById(userId, imageId);
    if (imageOrError.isFailure) {
      return new GetImageErrors.ImageNotFoundError(imageOrError.error);
    }
    const image = imageOrError.getValue();
    const fileId = image.fileId;

    // Start timing Google Drive retrieval
    const driveStartTime = Date.now();
    let file: GaxiosResponse<Readable> = await this.googleDriveService.getImageById(user, fileId);
    const driveEndTime = Date.now();
    const driveRetrievalTime = driveEndTime - driveStartTime;

    // Log retrieval time and image size
    const contentLength = file.headers['content-length'];
    const contentType = file.headers['content-type'];
    this.logger.log(`[GetImage] Google Drive retrieval:`, {
      imageId,
      fileId,
      retrievalTimeMs: driveRetrievalTime,
      contentLength: contentLength ? `${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB` : 'unknown',
      contentType,
      userId,
    });

    if (req.imageWidth) {
      this.logger.log(`[GetImage] Starting resize to width: ${req.imageWidth}px`);
      file = await this.resize(file, req.imageWidth);
    }
    return Result.ok<GaxiosResponse<Readable>, never>(file);
  }

  private async resize(
    file: GaxiosResponse<Readable>,
    width: number,
  ): Promise<GaxiosResponse<Readable>> {
    const originalSize = file.headers['content-length'];
    
    // Start timing resize operation
    const resizeStartTime = Date.now();
    const resizeResult: { resized: Readable; contentType: string } =
      await this.imageResizeService.resizeImage(file.data, width);
    const resizeEndTime = Date.now();
    const resizeTime = resizeEndTime - resizeStartTime;
    
    // Log resize timing
    this.logger.log(`[GetImage] Image resize completed:`, {
      resizeTimeMs: resizeTime,
      targetWidth: width,
      originalSize: originalSize ? `${(parseInt(originalSize) / 1024 / 1024).toFixed(2)} MB` : 'unknown',
      contentType: resizeResult.contentType,
    });
    
    file.data = resizeResult.resized;
    file.headers = {
      ...file.headers,
      'content-type': resizeResult.contentType,
    };
    delete file.headers['content-length'];

    return file;
  }
}
