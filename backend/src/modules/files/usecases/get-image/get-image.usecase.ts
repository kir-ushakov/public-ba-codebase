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

export class GetImageUsecase implements UseCase<GetImageRequest, Promise<GetImageResult>> {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly imageResizeService: ImageResizeService,
    private readonly imageRepoService: ImageRepoService,
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

    let file: GaxiosResponse<Readable> = await this.googleDriveService.getImageById(user, fileId);

    if (req.imageWidth) {
      file = await this.resize(file, req.imageWidth);
    }

    return Result.ok<GaxiosResponse<Readable>, never>(file);
  }

  private async resize(
    file: GaxiosResponse<Readable>,
    width: number,
  ): Promise<GaxiosResponse<Readable>> {
    // Start timing the resize operation
    const startTime = Date.now();

    // Log the original content type and requested width
    const originalContentType = file.headers['content-type'];
    const originalContentLength = file.headers['content-length'];
    const originalSizeBytes = originalContentLength ? parseInt(originalContentLength) : null;
    const originalSizeMB = originalSizeBytes
      ? (originalSizeBytes / (1024 * 1024)).toFixed(2)
      : 'unknown';

    console.log(`[GetImageUsecase] Starting resize operation:`, {
      requestedWidth: width,
      originalContentType,
      originalSizeInMB: `${originalSizeMB} MB`,
    });

    const resizeResult: { resized: Readable; contentType: string } =
      await this.imageResizeService.resizeImage(file.data, width);

    // Calculate resize duration
    const duration = Date.now() - startTime;

    // Log the resize results
    console.log(`[GetImageUsecase] Resize completed:`, {
      duration: `${duration}ms`,
      newContentType: resizeResult.contentType,
      originalContentType,
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
