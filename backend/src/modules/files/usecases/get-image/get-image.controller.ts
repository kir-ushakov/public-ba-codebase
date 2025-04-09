import { Request, Response } from 'express';
import { Readable } from 'stream';
import { GaxiosResponse } from 'googleapis-common';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { GetImageRequest, GetImageResult, GetImageUsecase } from './get-image.usecase.js';
import { UserMapper } from '../../../../shared/mappers/user.mapper.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';

export class GetImageController extends BaseController {
  private useCase: GetImageUsecase;

  constructor(useCase: GetImageUsecase) {
    super();
    this.useCase = useCase;
  }

  protected async executeImpl(
    req: Request,
    res: Response
  ): Promise<void | any> {
    const authenticatedUser: UserPersistent = req.user as UserPersistent;
    

    const MAX_IMAGE_WIDTH = 1000;
    let imageWidth = req.query.width ? parseInt(req.query.width as string) : undefined;

    if (imageWidth && imageWidth > MAX_IMAGE_WIDTH) {
      imageWidth = MAX_IMAGE_WIDTH;
    }

    try {

      let getImageRequest: GetImageRequest = {
        fileId: req.params.file.split('.')[0],
        user: UserMapper.toDomain(authenticatedUser),

        imageWidth
      };

      const result: GetImageResult = await this.useCase.execute(getImageRequest);

      if (result.isFailure) {
        const error: UseCaseError = result.error as UseCaseError;

        return BaseController.jsonResponse(res, error.code, {
          name: error.name,
          message: error.message,
        });
      } else {
        const file: GaxiosResponse<Readable> =
          result.getValue() as GaxiosResponse<Readable>;
        
        res.writeHead(200, file.headers);

        file.data.pipe(res);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}
