import { Request, Response, NextFunction } from 'express';
import { PassportStatic } from 'passport';
import { Result } from '../../../../shared/core/Result.js';
import { UseCaseError } from '../../../../shared/core/use-case-error.js';
import { LoginResponseDTO } from './login.dto.js';
import { UseCase } from '../../../../shared/core/UseCase.js';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { LoginError } from './login.errors.js';
import { LoginService } from '../../services/login.service.js';
import { UserMapper } from '../../../../shared/mappers/user.mapper.js';

export type LoginRequest = {
  context: { req: Request; res: Response; next: NextFunction };
};
export type LoginResult = Result<LoginResponseDTO | UseCaseError>;

export class LoginUsecase
  implements UseCase<LoginRequest, Promise<LoginResult>>
{
  private passport: PassportStatic;
  loginService: LoginService;

  constructor(passport: PassportStatic, loginService: LoginService) {
    this.passport = passport;
    this.loginService = loginService;
  }

  public execute(request: LoginRequest): Promise<LoginResult> {
    return new Promise<LoginResult>(async (resolve, reject) => {
      try {
        this.passport.authenticate(
          'local',
          async (err, userPersistent: UserPersistent) => {
            if (err) {
              return reject(err);
            }

            if (!userPersistent) {
              return resolve(new LoginError.LoginFailed());
            }

            if (!userPersistent.verified) {
              return resolve(new LoginError.UserAccountNotVerified());
            }

            const user = UserMapper.toDomain(userPersistent);
            const loginResponseDto: LoginResponseDTO =
              await this.loginService.login(
                user,
                request.context.req,
                request.context.res
              );
            return resolve(Result.ok(loginResponseDto));
          }
        )(request.context.req, request.context.res, request.context.next);
      } catch (err) {
        return reject(err);
      }
    });
  }
}
