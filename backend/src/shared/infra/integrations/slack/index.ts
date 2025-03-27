import { SlackService } from './slack.service.js';
import { models } from '../../../../shared/infra/database/mongodb/index.js';
import { SlackOAuthAccessRepo } from '../../../repo/slack-oauth-access.repo.js';

const slackOAuthAccessRepo = new SlackOAuthAccessRepo(models);

const slackService = new SlackService(slackOAuthAccessRepo);

export { slackService };
