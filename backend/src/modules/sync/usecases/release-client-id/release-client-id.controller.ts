import { Request, Response, NextFunction } from 'express';
import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import {
  IReleaseClientIdRequestDTO,
  IReleaseClientIdResponseDTO,
} from './release-client-id.dto';
import { ReleaseClientId } from './release-client-id.usecase';

export class ReleaseClientIdController extends BaseController {
  private _useCase: ReleaseClientId;

  constructor(useCase: ReleaseClientId) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(
    req: Request,
    res: Response,
    next?: NextFunction
  ): Promise<void | any> {
    const authenticatedUser: UserPersistent = req.user as UserPersistent;

    // TODO: We need to take from req device identity object in future
    // let dto: IReleaseClientIdRequestDTO = req.body as IReleaseClientIdRequestDTO;
    let dto: IReleaseClientIdRequestDTO = {
      userId: authenticatedUser._id,
    };

    try {
      const result: Result<UseCaseError | IReleaseClientIdResponseDTO> =
        await this._useCase.execute(dto);

      if (result.isFailure) {
        const error: UseCaseError = result.error as UseCaseError;
        switch (result.constructor) {
          // TODO: For this moment we don't have special usecase errors to handle here
          // case1,
          // case2
          //....
          default:
            return this.fail(res, error.message);
        }
      } else {
        return this.ok(res, result.getValue());
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}
