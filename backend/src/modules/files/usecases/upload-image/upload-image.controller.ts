import { Request, Response } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { UploadImageRequest } from './upload-image.request.js';
import { UploadImageResponse } from './upload-image.response.js';
import {
  UploadImageResult,
  UploadImageUsecase,
} from './upload-image.usecase.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { UserMapper } from '../../../../shared/mappers/user.mapper.js';

export class UploadImageController extends BaseController {
  private useCase: UploadImageUsecase;
  constructor(useCase: UploadImageUsecase) {
    super();
    this.useCase = useCase;
  }

  protected async executeImpl(
    req: Request,
    res: Response
  ): Promise<void | any> {
    const authenticatedUser: UserPersistent = req.user as UserPersistent;

    try {
      if (!(<any>req.file)) throw new Error('File not attached to request');

      let uploadImageRequest: UploadImageRequest = {
        file: req.file,
      };
      const user = UserMapper.toDomain(authenticatedUser);

      const result: UploadImageResult = await this.useCase.execute(
        uploadImageRequest,
        user
      );

      if (result.isFailure) {
        const error: UseCaseError = result.error as UseCaseError;

        return BaseController.jsonResponse(res, error.code, {
          name: error.name,
          message: error.message,
        });
      } else {
        const dto: UploadImageResponse =
          result.getValue() as UploadImageResponse;
        return this.ok<UploadImageResponse>(res, dto);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}
