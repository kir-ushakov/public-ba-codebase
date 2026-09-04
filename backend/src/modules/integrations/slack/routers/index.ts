import { Router } from 'express';
import { asyncHandler } from '../../../../shared/core/async-handler.function.js';
import { addToSlackController } from '../usecases/add-to-slack/index.js';
import { removeFromSlackController } from '../usecases/remove-from-slack/index.js';
import { slackEventRecivedController } from '../usecases/slack-event-received/index.js';
import { verificationChallenge } from '../middleware/verification-challenge.function.js';
import { isAuthenticated } from '../../../../shared/infra/auth/index.js';

const slackRouter: Router = Router();

slackRouter.post(
  '/install',
  isAuthenticated,
  asyncHandler(addToSlackController.execute.bind(addToSlackController)),
);

slackRouter.delete(
  '/install',
  isAuthenticated,
  asyncHandler(removeFromSlackController.execute.bind(removeFromSlackController)),
);

slackRouter.post(
  '/event-recived',
  verificationChallenge(),
  asyncHandler(slackEventRecivedController.execute.bind(slackEventRecivedController)),
);

export { slackRouter };
