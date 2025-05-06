import { Request, Response } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';

import { RemoveFromSlackUsecase, RemoveFromSlackResponse } from './remove-from-slack.usecase.js';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';

export class RemoveFromSlackController extends BaseController {
  private _useCase: RemoveFromSlackUsecase;

  constructor(useCase: RemoveFromSlackUsecase) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    try {
      const addToSlackResult: RemoveFromSlackResponse = await this._useCase.execute({
        userId,
      });

      if (addToSlackResult.isSuccess) {
        BaseController.jsonResponse(res, EHttpStatus.Ok);
      } else {
        const error = addToSlackResult.error;
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
