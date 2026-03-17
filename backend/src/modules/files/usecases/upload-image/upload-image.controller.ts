import { Request, Response } from 'express';
import { UploadImageContract } from '@brainassistant/contracts';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { UploadImageUsecase, UploadImageParams, UploadImageResult } from './upload-image.usecase.js';
import { UserMapper } from '../../../../shared/mappers/user.mapper.js';

export class UploadImageController extends BaseController {
  private useCase: UploadImageUsecase;
  constructor(useCase: UploadImageUsecase) {
    super();
    this.useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    try {
      if (!req.file) throw new Error('File not attached to request');

      // TODO: This mapping has to be a part of usecase
      // TICKET: https://brainas.atlassian.net/browse/BA-257
      const user = UserMapper.toDomain(loggedUser);
      const params = this.requestToUsecaseParams(req.body as Omit<UploadImageContract.Request, 'file'>, req.file as Express.Multer.File, userId);
    
      const result = await this.useCase.execute(params, user);

      if (result.isFailure) {
        const error = result.error;

        BaseController.jsonResponse(res, error.httpCode, {
          name: error.name,
          message: error.message,
        });
      } else {
        const response = this.usecaseResultToResponse(result);
        this.ok<UploadImageContract.Response>(res, response);
      }
    } catch (err) {
      this.fail(res, err);
    }
  }

  private requestToUsecaseParams(payload: Omit<UploadImageContract.Request, 'file'>, file: Express.Multer.File, userId: string): UploadImageParams {
    const imageId = payload.imageId;
    return {
      imageId,
      file,
      userId,
    };
  }

  private usecaseResultToResponse(result: UploadImageResult): UploadImageContract.Response {
    return result.getValue() as UploadImageContract.Response;
  }
}
