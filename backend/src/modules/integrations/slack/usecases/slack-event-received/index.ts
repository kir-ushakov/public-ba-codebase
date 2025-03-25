import { SlackEventReceivedController } from './slack-event-received.controller.js';
import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { SlackOAuthAccessRepo } from '../../../../../shared/repo/slack-oauth-access.repo.js';
import { SlackEventReceivedUsecase } from './slack-event-received.usecase.js';

const slackOAuthAccessRepo = new SlackOAuthAccessRepo(models);
const slackEventReceivedUsecase = new SlackEventReceivedUsecase(
  slackOAuthAccessRepo
);
const slackEventRecivedController = new SlackEventReceivedController(
  slackEventReceivedUsecase
);

export { slackEventRecivedController };
