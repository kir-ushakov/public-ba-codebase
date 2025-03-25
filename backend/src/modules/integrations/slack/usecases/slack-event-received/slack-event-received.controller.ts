import { Request, Response } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';
import {
  SlackEventReceivedUsecase,
  SlackEventReceivedResponse,
} from './slack-event-received.usecase.js';
import { SlackEventReceivedReqestDTO } from './slack-event-received.dto.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';

export class SlackEventReceivedController extends BaseController {
  private _useCase: SlackEventReceivedUsecase;

  constructor(useCase: SlackEventReceivedUsecase) {
    super();
    this._useCase = useCase;
  }
  protected async executeImpl(
    req: Request,
    res: Response
  ): Promise<void | any> {
    const dto: SlackEventReceivedReqestDTO = req.body;
    try {
      const slackEventReceivedResult: SlackEventReceivedResponse =
        await this._useCase.execute({
          dto: dto,
        });

      if (slackEventReceivedResult.isSuccess) {
        return BaseController.jsonResponse(res, EHttpStatus.Ok);
      } else {
        const error: UseCaseError =
          slackEventReceivedResult.error as UseCaseError;
        return BaseController.jsonResponse(res, error.code, {
          name: error.name,
          message: error.message,
        });
      }
    } catch (err) {
      return this.fail(res, err.toString());
    }
  }
}
