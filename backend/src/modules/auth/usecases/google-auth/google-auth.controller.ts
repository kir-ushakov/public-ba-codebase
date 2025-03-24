import { Request, Response, NextFunction } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../shared/infra/http/models/base-controller.js';
import { GoogleAuthResult, GoogleAuthUsecase } from './google-auth.usecase.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';

export class GoogleAuthController extends BaseController {
  private usecase: GoogleAuthUsecase;

  constructor(usecase: GoogleAuthUsecase) {
    super();
    this.usecase = usecase;
  }

  protected async executeImpl(
    req: Request,
    res: Response,
    next?: NextFunction
  ): Promise<void | any> {
    try {
      const result: GoogleAuthResult = await this.usecase.execute({
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
