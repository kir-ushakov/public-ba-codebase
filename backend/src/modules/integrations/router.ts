import { Router } from 'express';
import { slackRouter } from './slack/routers/index.js';
import { googleRouter } from './google/router.js';

const integrationsRouter: Router = Router();

integrationsRouter.use('/slack', slackRouter);
integrationsRouter.use('/google', googleRouter);

export { integrationsRouter };
