import { Request, Response } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../shared/infra/http/models/base-controller.js';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { GetAudioUsecase } from './get-audio.usecase.js';

export class GetAudioController extends BaseController {
  constructor(private readonly useCase: GetAudioUsecase) {
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
      const file = result.getValue();
      res.writeHead(EHttpStatus.Ok, {
        'Content-Type': file.mimeType,
        'Content-Length': String(file.sizeBytes),
      });
      file.data.once('error', () => res.destroy());
      res.once('close', () => file.data.destroy());
      file.data.pipe(res);
    } catch (err) {
      this.fail(res, err);
    }
  }
}
