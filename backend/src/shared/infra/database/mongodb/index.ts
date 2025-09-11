import { Model, PassportLocalModel } from 'mongoose';
import TaskModel, { TaskDocument } from './task.model.js';
import UserModel, { UserDocument } from './user.model.js';
import ClientModel, { ClientDocument } from './client.model.js';
import ActionModel, { ActionDocument } from './action.model.js';
import VerificationTokenModel, { VerificationTokenDocument } from './verification-token.model.js';
import SlackOAuthAccessModel, { ISlackOAuthAccessDocument } from './slack-oauth-access.model.js';
import ImageModel, { ImageDocument } from './image.model.js';

export interface IDbModels {
  TaskModel: Model<TaskDocument>;
  UserModel: PassportLocalModel<UserDocument>;
  VerificationTokenModel: Model<VerificationTokenDocument>;
  ClientModel: Model<ClientDocument>;
  SlackOAuthAccessModel: Model<ISlackOAuthAccessDocument>;
  ActionModel: Model<ActionDocument>;
  ImageModel: Model<ImageDocument>;
}

export const models: IDbModels = {
  TaskModel,
  UserModel,
  VerificationTokenModel,
  ClientModel,
  SlackOAuthAccessModel,
  ActionModel,
  ImageModel,
};
