import { Request, Response, NextFunction } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../shared/infra/http/models/base-controller.js';
import { LoginUsecase } from './login.usecase.js';

export class LoginController extends BaseController {
  private loginUsecase: LoginUsecase;

  constructor(loginUsecase: LoginUsecase) {
    super();
    this.loginUsecase = loginUsecase;
  }

  protected async executeImpl(req: Request, res: Response, next?: NextFunction): Promise<void> {
    try {
      const result = await this.loginUsecase.execute({
        context: { req, res, next },
      });
      if (result.isSuccess) {
        BaseController.jsonResponse(res, EHttpStatus.Ok, result.getValue());
      } else {
        const error = result.error;
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
