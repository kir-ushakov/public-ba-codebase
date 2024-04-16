import { Request, Response, NextFunction } from 'express';
import { UseCaseError } from '../../../../shared/core/use-case-error';
import { UserPersistent } from '../../../../shared/domain/models/user';
import { BaseController } from '../../../../shared/infra/http/models/base-controller';
import { EClientError } from '../../../../shared/domain/models/client.errors';
import { ChangeMapper } from '../../../../shared/mappers/change.mapper';
import { Change } from '../../domain/values/change';
import {
  IGetChangesRequestDTO,
  IGetChangesResponseDTO,
} from './get-changes.dto';
import { GetChangesErrors } from './get-changes.errors';
import { GetChangesResponse, GetChangesUC } from './get-changes.usecase';
import { IApiErrorDto } from '../../../../shared/infra/http/dtos/api-errors.dto';

export class GetChnagesController extends BaseController {
  private _useCase: GetChangesUC;

  constructor(useCase: GetChangesUC) {
    super();
    this._useCase = useCase;
  }

  protected async executeImpl(
    req: Request,
    res: Response,
    next?: NextFunction
  ): Promise<Response> {
    const authenticatedUser: UserPersistent = req.user as UserPersistent;

    let dto: IGetChangesRequestDTO = {
      userId: authenticatedUser._id,
      clientId: req.query.clientId as string,
    };

    try {
      const result: GetChangesResponse = await this._useCase.execute(dto);

      if (result.isFailure) {
        const error: UseCaseError = result.error as UseCaseError;
        switch (result.constructor) {
          case GetChangesErrors.ClientNotFoundError:
            const errorDto: IApiErrorDto = {
              name: EClientError.InvalidClientId,
              message: error.message,
            };
            return this.clientError(res, errorDto);

          default:
            return this.fail(res, error.message);
        }
      } else {
        const changes: Change[] = result.getValue() as Change[];
        const changesDTO: IGetChangesResponseDTO = {
          changes: changes.map((change) => ChangeMapper.toDTO(change)),
        };
        return this.ok<IGetChangesResponseDTO>(res, changesDTO);
      }
    } catch (err) {
      return this.fail(res, err);
    }
  }
}
