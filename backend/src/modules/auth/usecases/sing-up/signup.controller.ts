import { Request, Response, NextFunction } from 'express';
import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { SignUpRequestDTO, SignUpResponseDTO } from './signup.dto.js';
import { SignUp } from './signup.usecase.js';

export class SignupController extends BaseController {
  private _useCase: SignUp;

  constructor(useCase: SignUp) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(
    req: Request,
    res: Response,
    next?: NextFunction
  ): Promise<void | any> {
    let dto: SignUpRequestDTO = req.body as SignUpRequestDTO;

    // TODO data validation and sanitize has to be here
    // (https://www.npmjs.com/package/validator, https://www.npmjs.com/package/dompurify)

    try {
      const result: Result<UseCaseError | SignUpResponseDTO> =
        await this._useCase.execute(dto);

      if (result.isFailure) {
        const error: UseCaseError = result.error as UseCaseError;

        return BaseController.jsonResponse(res, error.code, {
          name: error.name,
          message: error.message,
        });
      } else {
        return this.ok(res, result.getValue());
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}
