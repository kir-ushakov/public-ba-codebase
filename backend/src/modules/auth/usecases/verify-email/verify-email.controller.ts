import { Request, Response } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { VerifyEmailUseCase } from './verify-email.usecase.js';
import { requestToUsecaseParams } from './verify-email.mapper.js';
import type { VerifyEmailRequestDTO } from './verify-email.dto.js';

export class VerifyEmailController extends BaseController {
  private _useCase: VerifyEmailUseCase;

  constructor(useCase: VerifyEmailUseCase) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    try {
      const payload: VerifyEmailRequestDTO = { token: req.query.token as string };
      const params = requestToUsecaseParams(payload);
      const result = await this._useCase.execute(params);

      if (result.isSuccess) {
        this.ok(res, result.getValue());
      } else {
        const error = result.error;

        BaseController.jsonResponse(res, error.httpCode, {
          name: error.name,
          message: error.message,
        });
      }
    } catch (error) {
      this.fail(res, error.toString());
    }
  }
}
