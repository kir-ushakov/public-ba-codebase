import { Request, Response } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { ImageUploadContract } from '@brainassistant/contracts';
import { UploadImageUsecase } from './upload-image.usecase.js';
import { UserMapper } from '../../../../shared/mappers/user.mapper.js';

export class UploadImageController extends BaseController {
  private useCase: UploadImageUsecase;
  constructor(useCase: UploadImageUsecase) {
    super();
    this.useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const authenticatedUser: UserPersistent = req.user as UserPersistent;

    try {
      if (!req.file) throw new Error('File not attached to request');

      const request = {
        imageId: req.body.imageId,
        file: req.file,  
      };
      const user = UserMapper.toDomain(authenticatedUser);

      const result = await this.useCase.execute(request, user);

      if (result.isFailure) {
        const error = result.error;

        BaseController.jsonResponse(res, error.httpCode, {
          name: error.name,
          message: error.message,
        });
      } else {
        // Success response - returns contract type
        const response = result.getValue() as ImageUploadContract.Response;
        this.ok<ImageUploadContract.Response>(res, response);
      }
    } catch (err) {
      this.fail(res, err);
    }
  }
}
