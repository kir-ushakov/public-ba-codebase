import { Request, Response } from 'express';
import { UploadAudioContract } from '@brainassistant/contracts';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { UploadAudioUsecase } from './upload-audio.usecase.js';

export class UploadAudioController extends BaseController {
  constructor(private readonly useCase: UploadAudioUsecase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser = req.user as UserPersistent;
    if (!req.file) {
      this.fail(res, 'Audio file is required');
      return;
    }
    const body = req.body as Omit<UploadAudioContract.Request, 'file'>;
    try {
      const result = await this.useCase.execute({
        audioId: body.audioId,
        file: req.file,
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
      const response: UploadAudioContract.Response = result.getValue();
      this.ok(res, response);
    } catch (err) {
      this.fail(res, err);
    }
  }
}
