import { ERefreshSessionUseCaseError } from '@brainassistant/contracts';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { User } from '../../../../shared/domain/models/user.js';
import { UserRepo } from '../../../../shared/repo/user.repo.js';
import { RefreshSessionRepo } from '../../../../shared/repo/refresh-session.repo.js';
import { LoginResponseDTO } from '../login/login.dto.js';
import { LoginService } from '../../services/login.service.js';
import { hashRefreshToken } from '../../services/refresh-token.function.js';
import { RefreshSessionErrors } from './refresh-session.errors.js';

export type RefreshSessionParams = {
  refreshToken: string | undefined;
};

export type RefreshSessionValue = {
  login: LoginResponseDTO;
  refreshToken: string;
  expiresAt: Date;
};

export type RefreshSessionResult = Result<
  RefreshSessionValue,
  UseCaseError<ERefreshSessionUseCaseError>
>;

export class RefreshSessionUsecase
  implements UseCase<RefreshSessionParams, Promise<RefreshSessionResult>>
{
  constructor(
    private readonly refreshSessions: RefreshSessionRepo,
    private readonly userRepo: UserRepo,
    private readonly loginService: LoginService,
  ) {}

  public async execute(params: RefreshSessionParams): Promise<RefreshSessionResult> {
    if (!params.refreshToken) {
      return RefreshSessionErrors.Invalid();
    }

    const session = await this.refreshSessions.consume(hashRefreshToken(params.refreshToken));
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      return RefreshSessionErrors.Invalid();
    }

    let user: User;
    try {
      user = await this.userRepo.findUserById(session.userId);
    } catch {
      return RefreshSessionErrors.Invalid();
    }

    const created = await this.loginService.createRefreshSession(user.id.toString());
    const login: LoginResponseDTO = {
      user: {
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.username.value,
        userId: user.id.toString(),
      },
    };

    return Result.ok({
      login,
      refreshToken: created.rawToken,
      expiresAt: created.expiresAt,
    });
  }
}
