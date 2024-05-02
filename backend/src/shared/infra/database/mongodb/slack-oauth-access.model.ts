import mongoose, { Document, Schema } from 'mongoose';
import { ISlackOAuthAccessPresitant } from '../../../domain/models/slack-oauth-access';

export interface ISlackOAuthAccessDocument
  extends ISlackOAuthAccessPresitant,
    Document<string> {}

const SlackOAuthAccessSchema = new Schema({
  _id: { type: String, require: true },
  userId: { type: String, require: true },
  accessToken: { type: String, require: true },
  authedUserId: { type: String, require: true },
  slackBotUserId: { type: String, require: true },
  teamId: { type: String, require: true },
});

const SlackOAuthAccessModel = mongoose.model<ISlackOAuthAccessDocument>(
  'SlackOAuthAccess',
  SlackOAuthAccessSchema
);

export default SlackOAuthAccessModel;
