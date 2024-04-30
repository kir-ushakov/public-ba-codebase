import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/infra/http/models/base-controller';

export class LogoutController extends BaseController {
  protected async executeImpl(
    req: Request,
    res: Response,
    next?: NextFunction
  ): Promise<void | any> {
    try {
      if (process.env.AUTHENTICATION_STRATEGY === 'SESSION') {
        if (req.isAuthenticated()) {
          req.logout((err: any) => {
            console.log(err);
          });
        }
      }

      if (process.env.AUTHENTICATION_STRATEGY === 'JWT') {
        res.clearCookie('jwt');
      }
      return this.ok(res);
    } catch (err) {
      return this.fail(res, err.toString());
    }
  }
}
