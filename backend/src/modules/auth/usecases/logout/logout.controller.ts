import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { LoginService } from '../../services/login.service.js';
import { LogoutUsecase } from './logout.usecase.js';

export class LogoutController extends BaseController {
  constructor(private readonly usecase: LogoutUsecase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const rawCookie = req.cookies?.[LoginService.REFRESH_COOKIE_NAME];
      const refreshToken = typeof rawCookie === 'string' ? rawCookie : undefined;
      await this.usecase.execute({ refreshToken });
      LoginService.clearJwtCookie(res);
      LoginService.clearRefreshCookie(res);
      this.ok(res);
    } catch (err) {
      this.fail(res, err);
    }
  }
}
