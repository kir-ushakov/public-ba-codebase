import { Request, Response } from 'express';
import { SendChangeContract, TagDTO } from '@brainassistant/contracts';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { TagMapper } from '../../../../../shared/mappers/tag.mapper.js';
import { CreateTag, CreateTagResult } from './create-tag.usecase.js';
import { requestToUsecaseParams } from './create-tag.mapper.js';

export class CreateTagController extends BaseController {
  constructor(private readonly useCase: CreateTag) {
    super();
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    try {
      const body = req.body as SendChangeContract.Request<TagDTO>;
      const params = requestToUsecaseParams(body, userId);

      const createResult: CreateTagResult = await this.useCase.execute(params);

      if (createResult.isSuccess) {
        const response: SendChangeContract.Response<TagDTO> =
          this.usecaseResultToResponse(createResult);
        BaseController.jsonResponse(res, EHttpStatus.Created, response);
      } else {
        const error = createResult.error;
        BaseController.jsonResponse(res, error.httpCode, {
          name: error.code,
          message: error.message,
        });
      }
    } catch (err) {
      this.fail(res, err);
    }
  }

  private usecaseResultToResponse(result: CreateTagResult): SendChangeContract.Response<TagDTO> {
    return TagMapper.toDTO(result.getValue());
  }
}
