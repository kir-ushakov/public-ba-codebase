import { Request, Response } from 'express';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { IGetChangesRequestDTO, IGetChangesResponseDTO } from './get-changes.dto.js';
import { GetChangesResponse, GetChangesUC } from './get-changes.usecase.js';
import { ChangeMapper } from '../../../../shared/mappers/change.mapper.js';
import { Change } from '../../domain/values/change.js';

export class GetChnagesController extends BaseController {
  private _useCase: GetChangesUC;

  constructor(useCase: GetChangesUC) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(req: Request, res: Response): Promise<Response> {
    const authenticatedUser: UserPersistent = req.user as UserPersistent;

    let dto: IGetChangesRequestDTO = {
      userId: authenticatedUser._id,
      clientId: req.query.clientId as string,
    };

    try {
      const result: GetChangesResponse = await this._useCase.execute(dto);

      if (result.isFailure) {
        const error = result.error;

        return BaseController.jsonResponse(res, error.httpCode, {
          name: error.name,
          message: error.message,
        });
      } else {
        const changes: Change[] = result.getValue() as Change[];
        const changesDTO: IGetChangesResponseDTO = {
          changes: changes.map(change => ChangeMapper.toDTO(change)),
        };
        return this.ok<IGetChangesResponseDTO>(res, changesDTO);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}
