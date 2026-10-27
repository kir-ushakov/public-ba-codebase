import { RefreshSessionContract } from '@brainassistant/contracts';
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { LoginService } from '../../services/login.service.js';
import { RefreshSessionUsecase } from './refresh-session.usecase.js';

export class RefreshSessionController extends BaseController {
  constructor(private readonly usecase: RefreshSessionUsecase) {
    super();
  }

  protected async executeImpl(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      const rawCookie = req.cookies?.[LoginService.REFRESH_COOKIE_NAME];
      const refreshToken = typeof rawCookie === 'string' ? rawCookie : undefined;
      const result = await this.usecase.execute({ refreshToken });
      if (result.isSuccess) {
        const value = result.getValue();
        LoginService.setJwtCookie(res, value.login);
        LoginService.setRefreshCookie(res, value.refreshToken, value.expiresAt);
        const response: RefreshSessionContract.Response = { refreshed: true };
        this.ok(res, response);
        return;
      }
      const error = result.error;
      BaseController.jsonResponse(res, error.httpCode, {
        name: error.code,
        message: error.message,
      });
    } catch (err) {
      this.fail(res, err);
    }
  }
}
