import { Router } from 'express';
import { getOAuthConsentScreenController } from './usecases/get-oauth-consent-screen/index.js';
import { googleAuthController } from '../../auth/usecases/google-auth/index.js';
const googleRouter: Router = Router();

googleRouter.get('/oauth-consent-screen', (req, res) =>
  getOAuthConsentScreenController.execute(req, res)
);

googleRouter.get('/auth', (req, res, next) =>
  googleAuthController.execute(req, res, next)
);

export { googleRouter };
