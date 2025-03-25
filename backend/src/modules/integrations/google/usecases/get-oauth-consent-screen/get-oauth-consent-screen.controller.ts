import { PassportStatic } from 'passport';
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/infra/http/models/base-controller.js';

export class GetOAuthConsentScreenController extends BaseController {
  private _passport: PassportStatic;

  constructor(passport: PassportStatic) {
    super();
    this._passport = passport;
  }

  protected async executeImpl(
    req: Request,
    res: Response,
    next?: NextFunction
  ): Promise<void | any> {
    try {
      this._passport.authenticate('google', {
        scope: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/drive.appdata',
        ],
        accessType: 'offline',
      })(req, res, next);
    } catch (err) {
      return this.fail(res, err.toString());
    }
  }
}
