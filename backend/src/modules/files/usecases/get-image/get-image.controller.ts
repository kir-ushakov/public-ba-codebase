import { Request, Response } from 'express';
import { ImageConst } from '@brainassistant/contracts';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { GetImageRequest, GetImageResult, GetImageUsecase } from './get-image.usecase.js';
import { UserMapper } from '../../../../shared/mappers/user.mapper.js';

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
        user: UserMapper.toDomain(authenticatedUser),
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
        const file = result.getValue();

        res.writeHead(200, file.headers);

        file.data.pipe(res);
      }
    } catch (err) {
      this.fail(res, err);
    }
  }
}
