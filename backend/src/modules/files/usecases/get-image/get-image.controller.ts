import { Request, Response } from 'express';
import { ImageConst } from '@brainassistant/contracts';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import {
  BaseController,
  EHttpStatus,
} from '../../../../shared/infra/http/models/base-controller.js';
import {
  GetImageRequest,
  GetImageResult,
  GetImageUsecase,
  ImageFile,
} from './get-image.usecase.js';
import { IMAGE_CACHE_CONTROL } from '../../config.js';

export class GetImageController extends BaseController {
  private useCase: GetImageUsecase;

  constructor(useCase: GetImageUsecase) {
    super();
    this.useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const authenticatedUser: UserPersistent = req.user as UserPersistent;

    let imageWidth = req.query.width ? parseInt(req.query.width as string) : undefined;

    if (imageWidth && imageWidth > ImageConst.MAX_LONG_EDGE_PX) {
      imageWidth = ImageConst.MAX_LONG_EDGE_PX;
    }

    try {
      const imageId = req.params.imageId;
      if (!imageId) {
        this.fail(res, 'imageId is required');
        return;
      }
      const getImageRequest: GetImageRequest = {
        imageId,
        userId: String(authenticatedUser._id),
        imageWidth,
      };

      const result: GetImageResult = await this.useCase.execute(getImageRequest);

      if (result.isFailure) {
        const error = result.error;

        BaseController.jsonResponse(res, error.httpCode, {
          name: error.code,
          message: error.message,
        });
      } else {
        this.sendImage(req, res, result.getValue());
      }
    } catch (err) {
      this.fail(res, err);
    }
  }

  private sendImage(req: Request, res: Response, file: ImageFile): void {
    const cacheHeaders = { ETag: file.etag, 'Cache-Control': IMAGE_CACHE_CONTROL };

    if (req.headers['if-none-match'] === file.etag) {
      file.data.destroy();
      res.writeHead(EHttpStatus.NotModified, cacheHeaders);
      res.end();
      return;
    }

    const headers: Record<string, string> = { ...cacheHeaders, 'Content-Type': file.contentType };
    if (file.contentLength !== undefined) {
      headers['Content-Length'] = String(file.contentLength);
    }

    // Headers are already sent once bytes flow, so a read error can only abort the response.
    file.data.once('error', () => res.destroy());
    res.once('close', () => file.data.destroy());
    res.writeHead(EHttpStatus.Ok, headers);
    file.data.pipe(res);
  }
}
