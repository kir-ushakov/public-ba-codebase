import { Router } from 'express';
import { getOAuthConsentScreenController } from './usecases/get-oauth-consent-screen';
import { googleAuthController } from '../../auth/useCases/google-auth';
const googleRouter: Router = Router();

googleRouter.get('/oauth-consent-screen', (req, res) =>
  getOAuthConsentScreenController.execute(req, res)
);

googleRouter.get('/auth', (req, res, next) =>
  googleAuthController.execute(req, res, next)
);

export { googleRouter };
