import { Router } from 'express';
import { addToSlackController } from '../usecases/add-to-slack/index.js';
import { removeFromSlackController } from '../usecases/remove-from-slack/index.js';
import { slackEventRecivedController } from '../usecases/slack-event-received/index.js';
import { verificationChallenge } from '../middleware/verification-challenge.function.js';
import { isAuthenticated } from '../../../../shared/infra/auth/index.js';

const slackRouter: Router = Router();

slackRouter.post('/install', isAuthenticated, (req, res) =>
  addToSlackController.execute(req, res)
);

slackRouter.delete('/install', isAuthenticated, (req, res) =>
  removeFromSlackController.execute(req, res)
);

slackRouter.post('/event-recived', verificationChallenge(), (req, res) =>
  slackEventRecivedController.execute(req, res)
);

export { slackRouter };
