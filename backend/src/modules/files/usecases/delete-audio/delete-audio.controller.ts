import { Request, Response } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { DeleteAudioUsecase } from './delete-audio.usecase.js';

export class DeleteAudioController extends BaseController {
  constructor(private readonly useCase: DeleteAudioUsecase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser = req.user as UserPersistent;
    const audioId = req.params.audioId;
    if (!audioId) {
      this.fail(res, 'audioId is required');
      return;
    }
    try {
      const result = await this.useCase.execute({
        audioId,
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
      this.ok(res, { audioId });
    } catch (err) {
      this.fail(res, err);
    }
  }
}
