import { PassportStatic } from 'passport';
import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../../shared/infra/http/models/base-controller.js';

export class GetOAuthConsentScreenController extends BaseController {
  private _passport: PassportStatic;

  constructor(passport: PassportStatic) {
    super();
    this._passport = passport;
  }

  protected executeImpl(req: Request, res: Response, next?: NextFunction): Promise<void> {
    if (!next) {
      this.fail(res, 'Express next() is required');
      return Promise.resolve();
    }
    try {
      // Sign-in only. Google Drive access, when needed again, gets its own incremental consent.
      this._passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
      })(req, res, next);
    } catch (err) {
      this.fail(res, err);
    }
    return Promise.resolve();
  }
}
