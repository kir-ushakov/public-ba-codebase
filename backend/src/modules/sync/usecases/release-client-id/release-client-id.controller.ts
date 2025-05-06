import { Request, Response } from 'express';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { IReleaseClientIdRequestDTO } from './release-client-id.dto.js';
import { ReleaseClientId } from './release-client-id.usecase.js';

export class ReleaseClientIdController extends BaseController {
  private _useCase: ReleaseClientId;

  constructor(useCase: ReleaseClientId) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<void> {
    const authenticatedUser: UserPersistent = req.user as UserPersistent;

    // TODO: We need to take from req device identity object in future
    // let dto: IReleaseClientIdRequestDTO = req.body as IReleaseClientIdRequestDTO;
    let dto: IReleaseClientIdRequestDTO = {
      userId: authenticatedUser._id,
    };

    try {
      const result = await this._useCase.execute(dto);

      if (result.isFailure) {
        const error = result.error;
        switch (result.constructor) {
          // TODO: For this moment we don't have special usecase errors to handle here
          // case1,
          // case2
          //....
          default:
            this.fail(res, error.message);
        }
      } else {
        this.ok(res, result.getValue());
      }
    } catch (err) {
      this.fail(res, err);
    }
  }
}
