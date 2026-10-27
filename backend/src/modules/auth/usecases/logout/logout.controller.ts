import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';

export class LogoutController extends BaseController {
  protected executeImpl(_req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      res.clearCookie('jwt');
      this.ok(res);
    } catch (err) {
      this.fail(res, err);
    }
    return Promise.resolve();
  }
}
