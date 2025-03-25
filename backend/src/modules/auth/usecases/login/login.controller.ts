import { Request, Response, NextFunction } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../shared/infra/http/models/base-controller.js';
import { LoginResult, LoginUsecase } from './login.usecase.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';

export class LoginController extends BaseController {
  private loginUsecase: LoginUsecase;

  constructor(loginUsecase: LoginUsecase) {
    super();
    this.loginUsecase = loginUsecase;
  }

  protected async executeImpl(
    req: Request,
    res: Response,
    next?: NextFunction
  ): Promise<void | any> {
    try {
      const result: LoginResult | UseCaseError =
        await this.loginUsecase.execute({
          context: { req, res, next },
        });
      if (result.isSuccess) {
        return BaseController.jsonResponse(
          res,
          EHttpStatus.Ok,
          result.getValue()
        );
      } else {
        const error: UseCaseError = result.error as UseCaseError;
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
