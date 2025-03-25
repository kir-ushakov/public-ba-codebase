import { Request, Response, NextFunction } from 'express';
import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import {
  VerifyEmailRequestDTO,
  IVerifyEmailResponceDTO,
} from './verify-email.dto.js';
import { VerifyEmailUseCase } from './verify-email.usecase.js';

export class VerifyEmailController extends BaseController {
  private _useCase: VerifyEmailUseCase;

  constructor(useCase: VerifyEmailUseCase) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(
    req: Request,
    res: Response,
    next?: NextFunction
  ): Promise<void | any> {
    let dto: VerifyEmailRequestDTO = {
      token: req.query.token as string,
    };

    try {
      const result: Result<UseCaseError | IVerifyEmailResponceDTO> =
        await this._useCase.execute(dto);

      if (result.isFailure) {
        const error: UseCaseError = result.error as UseCaseError;

        switch (result.constructor) {
          // TODO: case when token do not exists in DB
          // case VerifyEmailErrors.GivenTokenDoNotExist :

          default:
            return this.fail(res, error.message);
        }
      } else {
        return this.ok(res, result.getValue());
      }
    } catch (error) {
      return this.fail(res, error);
    }
  }
}
