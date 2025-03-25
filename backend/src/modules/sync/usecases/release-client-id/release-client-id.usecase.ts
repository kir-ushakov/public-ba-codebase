import { UseCase } from '../../../../shared/core/UseCase.js';
import {
  IReleaseClientIdRequestDTO,
  IReleaseClientIdResponseDTO,
} from './release-client-id.dto.js';
import { Result } from '../../../../shared/core/Result.js';
import {
  Client,
  IClientProps,
} from '../../../../shared/domain/models/client.js';
import { ClientRepo } from '../../../../shared/repo/client.repo.js';
import { UserRepo } from '../../../../shared/repo/user.repo.js';
import { ReleaseClientIdErrors } from './release-client-id.errors.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';

type Response =
  | Result<IReleaseClientIdResponseDTO | UseCaseError>
  | ReleaseClientIdErrors.UserDoesNotExistError;

export class ReleaseClientId
  implements UseCase<IReleaseClientIdRequestDTO, Promise<Response>>
{
  private _clientRepo: ClientRepo;
  private _userRepo: UserRepo;

  constructor(clientRepo: ClientRepo, userRepo: UserRepo) {
    this._clientRepo = clientRepo;
    this._userRepo = userRepo;
  }

  public async execute(dto: IReleaseClientIdRequestDTO): Promise<Response> {
    const { userId } = dto;

    // I think (not sure) we don't need to check does user exist,
    // because we get this id from auth information
    // but better to check twice
    try {
      await this._userRepo.findUserById(userId);
    } catch (err) {
      return new ReleaseClientIdErrors.UserDoesNotExistError(userId);
    }

    const clientOrError: Result<Client> = await this.createNewCleintInDB(
      userId
    );

    if (clientOrError.isFailure) {
      return Result.fail('Cannot get ClientId for sync');
    }
    const client: Client = clientOrError.getValue() as Client;
    return Result.ok({ clientId: client.id.toString() });
  }

  private async createNewCleintInDB(userId: string): Promise<Result<Client>> {
    const clientProps: IClientProps = {
      userId: userId,
      syncTime: null,
    };

    const clientOrError: Result<Client> = await Client.create(clientProps);

    if (clientOrError.isFailure) {
      // TODO: for this moment there is no suppose that it can be failed in normal flow
      // return new ReleaseClientId.SomeProblem(dto.email);
    }
    const client: Client = clientOrError.getValue();

    await this._clientRepo.create(client);

    return Result.ok(client);
  }
}
