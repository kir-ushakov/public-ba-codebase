import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';

export class LogoutController extends BaseController {
  protected executeImpl(req: Request, res: Response, _next?: NextFunction): Promise<void> {
    try {
      if (process.env.AUTHENTICATION_STRATEGY === 'SESSION') {
        if (req.isAuthenticated()) {
          req.logout((err: Error) => {
            console.log(err);
          });
        }
      }

      if (process.env.AUTHENTICATION_STRATEGY === 'JWT') {
        res.clearCookie('jwt');
      }
      this.ok(res);
    } catch (err) {
      this.fail(res, err.toString());
    }
    return Promise.resolve();
  }
}
