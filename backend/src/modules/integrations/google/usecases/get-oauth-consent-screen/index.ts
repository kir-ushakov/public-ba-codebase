import passport from 'passport';
import { GetOAuthConsentScreenController } from './get-oauth-consent-screen.controller';

const getOAuthConsentScreenController = new GetOAuthConsentScreenController(
  passport
);

export { getOAuthConsentScreenController };
