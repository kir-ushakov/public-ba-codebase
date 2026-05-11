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
      const forceConsentParam = req.query.forceConsent;
      const forceConsentString = Array.isArray(forceConsentParam)
        ? forceConsentParam[0]
        : forceConsentParam;

      const forceConsent =
        forceConsentString === '1' || forceConsentString === 'true';

      const authOptions: Record<string, unknown> = {
        scope: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/drive.appdata',
        ],
        accessType: 'offline',
      };

      // Google returns refresh_token reliably only when we force consent
      // (e.g. when user already granted scopes previously).
      if (forceConsent) {
        authOptions.prompt = 'consent';
      }

      this._passport.authenticate('google', {
        ...authOptions,
      })(req, res, next);
    } catch (err) {
      return this.fail(res, err.toString());
    }
  }
}
