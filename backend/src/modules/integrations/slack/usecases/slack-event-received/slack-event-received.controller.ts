import { Request, Response } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';
import {
  SlackEventReceivedUsecase,
  SlackEventReceivedResponse,
} from './slack-event-received.usecase.js';
import { requestToUsecaseParams } from './slack-event-received.mapper.js';

export class SlackEventReceivedController extends BaseController {
  private _useCase: SlackEventReceivedUsecase;

  constructor(useCase: SlackEventReceivedUsecase) {
    super();
    this._useCase = useCase;
  }
  protected async executeImpl(req: Request, res: Response): Promise<void> {
    try {
      const params = requestToUsecaseParams(req.body);
      const slackEventReceivedResult: SlackEventReceivedResponse = await this._useCase.execute(params);

      if (slackEventReceivedResult.isSuccess) {
        BaseController.jsonResponse(res, EHttpStatus.Ok);
      } else {
        const error = slackEventReceivedResult.error;
        BaseController.jsonResponse(res, error.httpCode, {
          name: error.name,
          message: error.message,
        });
      }
    } catch (err) {
      this.fail(res, err.toString());
    }
  }
}
