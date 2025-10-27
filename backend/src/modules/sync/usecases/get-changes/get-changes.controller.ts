import { Request, Response } from 'express';
import { GetChangesContract } from '@brainassistant/contracts';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { GetChanges, GetChangesParams, GetChangesResult } from './get-changes.usecase.js';
import { ChangeMapper } from '../../../../shared/mappers/change.mapper.js';
import { Change } from '../../domain/values/change.js';

export class GetChnagesController extends BaseController {
  private _useCase: GetChanges;

  constructor(useCase: GetChanges) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    const authenticatedUser: UserPersistent = req.user as UserPersistent;
    const userId = authenticatedUser._id;

    const params = this.requestToUsecaseParams(req.query as unknown as GetChangesContract.Request, userId);

    try {
      const result: GetChangesResult = await this._useCase.execute(params);

      if (result.isFailure) {
        const error = result.error;

        return BaseController.jsonResponse(res, error.httpCode, {
          name: error.code,
          message: error.message,
        });
      } else {
        const response = this.usecaseResultToResponse(result);
        return this.ok<GetChangesContract.Response>(res, response);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }

  private requestToUsecaseParams(payload: GetChangesContract.Request, userId: string): GetChangesParams {
    return {
      clientId: payload.clientId,
      userId,
    };
  }

  private usecaseResultToResponse(result: GetChangesResult): GetChangesContract.Response {
    const changes: Change[] = result.getValue() as Change[];
    return {
      changes: changes.map(change => ChangeMapper.toDTO(change)),
    };
  }
}
