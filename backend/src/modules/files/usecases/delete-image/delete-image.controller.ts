import { Request, Response } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { DeleteImageUsecase } from './delete-image.usecase.js';

export class DeleteImageController extends BaseController {
  constructor(private readonly useCase: DeleteImageUsecase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser = req.user as UserPersistent;
    const imageId = req.params.imageId;
    if (!imageId) {
      this.fail(res, 'imageId is required');
      return;
    }
    try {
      const result = await this.useCase.execute({
        imageId,
        userId: String(loggedUser._id),
      });
      if (result.isFailure) {
        const error = result.error;
        BaseController.jsonResponse(res, error.httpCode, {
          name: error.code,
          message: error.message,
        });
        return;
      }
      this.ok(res, { imageId });
    } catch (err) {
      this.fail(res, err);
    }
  }
}
