import { Request, Response } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { SignUpRequestDTO } from './signup.dto.js';
import { SignUp } from './signup.usecase.js';

export class SignupController extends BaseController {
  private _useCase: SignUp;

  constructor(useCase: SignUp) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    let dto: SignUpRequestDTO = req.body as SignUpRequestDTO;

    // TODO data validation and sanitize has to be here
    // (https://www.npmjs.com/package/validator, https://www.npmjs.com/package/dompurify)

    try {
      const result = await this._useCase.execute({ dto });

      if (result.isFailure) {
        const error = result.error;

        BaseController.jsonResponse(res, error.httpCode, {
          name: error.name,
          message: error.message,
        });
      } else {
        this.ok(res, result.getValue());
      }
    } catch (err) {
      this.fail(res, err);
    }
  }
}
