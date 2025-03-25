import { Request, Response } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../../shared/infra/http/models/base-controller.js';

import {
  RemoveFromSlackUsecase,
  RemoveFromSlackResponse,
} from './remove-from-slack.usecase';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { UserPersistent } from '../../../../../shared/domain/models/user.js';

export class RemoveFromSlackController extends BaseController {
  private _useCase: RemoveFromSlackUsecase;

  constructor(useCase: RemoveFromSlackUsecase) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(
    req: Request,
    res: Response
  ): Promise<void | any> {
    const loggedUser: UserPersistent = req.user as UserPersistent;
    const userId = loggedUser._id;

    try {
      const addToSlackResult: RemoveFromSlackResponse =
        await this._useCase.execute({
          userId,
        });

      if (addToSlackResult.isSuccess) {
        return BaseController.jsonResponse(res, EHttpStatus.Ok);
      } else {
        const error: UseCaseError = addToSlackResult.error as UseCaseError;
        BaseController.jsonResponse(res, error.code, {
          name: error.name,
          message: error.message,
        });
      }
    } catch (err) {
      return this.fail(res, err.toString());
    }
  }
}
