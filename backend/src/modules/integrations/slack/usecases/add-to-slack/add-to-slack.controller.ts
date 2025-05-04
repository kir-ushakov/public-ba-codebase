import { Request, Response } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';

import { AddToSlackUsecase, AddToSlackResponse } from './add-to-slack.usecase.js';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';
import { AddToSlackError } from './add-to-slack.errors.js';

export class AddToSlackController extends BaseController {
  private _useCase: AddToSlackUsecase;

  constructor(useCase: AddToSlackUsecase) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    const code = req.body.code as string;

    try {
      const addToSlackResult: AddToSlackResponse = await this._useCase.execute({
        req,
        res,
        code,
        userId,
      });

      if (addToSlackResult.isSuccess) {
        BaseController.jsonResponse(res, EHttpStatus.Created);
      } else {
        const error = addToSlackResult.error as AddToSlackError;
        BaseController.jsonResponse(res, error.code, {
          name: error.name,
          message: error.message,
        });
      }
    } catch (err) {
      this.fail(res, err.toString());
    }
  }
}
