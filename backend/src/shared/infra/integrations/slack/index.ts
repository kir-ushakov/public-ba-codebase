import { SlackService } from './slack.service';
import { models } from '../../../../shared/infra/database/mongodb/index';
import { SlackOAuthAccessRepo } from '../../../repo/slack-oauth-access.repo';

const slackOAuthAccessRepo = new SlackOAuthAccessRepo(models);

const slackService = new SlackService(slackOAuthAccessRepo);

export { slackService };
