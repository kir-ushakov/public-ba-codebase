import { UseCase } from '../../../../shared/core/UseCase.js';
import { Result } from '../../../../shared/core/result.js';
import { RefreshSessionRepo } from '../../../../shared/repo/refresh-session.repo.js';
import { hashRefreshToken } from '../../services/refresh-token.function.js';

export type LogoutParams = {
  refreshToken: string | undefined;
};

export class LogoutUsecase implements UseCase<LogoutParams, Promise<Result<void>>> {
  constructor(private readonly refreshSessions: RefreshSessionRepo) {}

  public async execute(params: LogoutParams): Promise<Result<void>> {
    if (params.refreshToken) {
      await this.refreshSessions.consume(hashRefreshToken(params.refreshToken));
    }
    return Result.ok();
  }
}
