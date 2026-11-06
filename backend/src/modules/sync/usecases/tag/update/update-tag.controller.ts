import { Request, Response } from 'express';
import { SendChangeContract, TagDTO } from '@brainassistant/contracts';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { TagMapper } from '../../../../../shared/mappers/tag.mapper.js';
import { UpdateTag, UpdateTagResult } from './update-tag.usecase.js';
import { requestToUsecaseParams } from './update-tag.mapper.js';

export class UpdateTagController extends BaseController {
  constructor(private readonly useCase: UpdateTag) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    try {
      const body = req.body as SendChangeContract.Request<TagDTO>;
      const params = requestToUsecaseParams(body, userId);
      const updateResult: UpdateTagResult = await this.useCase.execute(params);

      if (updateResult.isSuccess) {
        const response: SendChangeContract.Response<TagDTO> =
          this.usecaseResultToResponse(updateResult);
        BaseController.jsonResponse(res, EHttpStatus.Ok, response);
      } else {
        const error = updateResult.error;
        BaseController.jsonResponse(res, error.httpCode, {
          name: error.code,
          message: error.message,
        });
      }
    } catch (err) {
      this.fail(res, err);
    }
  }

  private usecaseResultToResponse(result: UpdateTagResult): SendChangeContract.Response<TagDTO> {
    return TagMapper.toDTO(result.getValue());
  }
}
