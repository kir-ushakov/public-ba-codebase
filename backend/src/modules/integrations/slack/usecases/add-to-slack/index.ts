import { WebClient } from '@slack/web-api';
import { AddToSlackController } from './add-to-slack.controller.js';
import { AddToSlackUsecase } from './add-to-slack.usecase.js';
import { models } from '../../../../../shared/infra/database/mongodb/index.js';
import { SlackOAuthAccessRepo } from '../../../../../shared/repo/slack-oauth-access.repo.js';

const webClient = new WebClient();
const slackOAuthAccessRepo = new SlackOAuthAccessRepo(models);
const addToSlackUsecase = new AddToSlackUsecase(
  webClient,
  slackOAuthAccessRepo
);

const addToSlackController = new AddToSlackController(addToSlackUsecase);

export { addToSlackController };
