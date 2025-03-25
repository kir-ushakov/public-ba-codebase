import { WebClient } from '@slack/web-api';
import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { SlackOAuthAccessRepo } from '../../../../../shared/repo/slack-oauth-access.repo.js';
import { RemoveFromSlackUsecase } from './remove-from-slack.usecase.js';
import { RemoveFromSlackController } from './remove-from-slack.controller.js';

const webClient = new WebClient();

const slackOAuthAccessRepo = new SlackOAuthAccessRepo(models);

const removeFromSlackUsecase = new RemoveFromSlackUsecase(
  webClient,
  slackOAuthAccessRepo
);

const removeFromSlackController = new RemoveFromSlackController(
  removeFromSlackUsecase
);

export { removeFromSlackController };
