import { Router } from 'express';
import { asyncHandler } from '../../../shared/core/async-handler.function.js';
import { getOAuthConsentScreenController } from './usecases/get-oauth-consent-screen/index.js';
import { googleAuthController } from '../../auth/usecases/google-auth/index.js';

const googleRouter: Router = Router();

googleRouter.get(
  '/oauth-consent-screen',
  asyncHandler(getOAuthConsentScreenController.execute.bind(getOAuthConsentScreenController)),
);

googleRouter.get('/auth', asyncHandler(googleAuthController.execute.bind(googleAuthController)));

export { googleRouter };
