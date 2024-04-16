import { Request, Response, NextFunction } from 'express';
import {
  BaseController,
  EHttpStatus,
} from '../../../../shared/infra/http/models/base-controller';
import { PassportStatic } from 'passport';
import { UserPersistent } from '../../../../shared/domain/models/user';
import { EApiErrorType } from '../../../../shared/infra/http/models/api-error-types.enum';
import { LoginService } from '../../services/login.service';

export class LoginController extends BaseController {
  private _passport: PassportStatic;
  private loginService: LoginService;

  constructor(passport: PassportStatic, loginService: LoginService) {
    super();
    this._passport = passport;
    this.loginService = loginService;
  }

  protected async executeImpl(
    req: Request,
    res: Response,
    next?: NextFunction
  ): Promise<void | any> {
    try {
      this._passport.authenticate(
        'local',
        async (err, user: UserPersistent) => {
          if (err) {
            return this.fail(res, err);
          }

          if (!user) {
            return BaseController.jsonResponse(res, EHttpStatus.Unauthorized, {
              name: EApiErrorType.AUTHENTICATION_FAILED,
              message: 'Authorization failed!',
            });
          }

          if (!user.verified) {
            return BaseController.jsonResponse(res, EHttpStatus.Unauthorized, {
              name: EApiErrorType.USER_ACCOUNT_NOT_VERIFIED,
              message: 'User account not verified!',
            });
          }

          try {
            const loginResponseDto = await this.loginService.login(
              user,
              req,
              res
            );
            return this.ok(res, loginResponseDto);
          } catch (err) {
            return this.fail(res, err);
          }
        }
      )(req, res, next);
    } catch (err) {
      return this.fail(res, err.toString());
    }
  }
}
