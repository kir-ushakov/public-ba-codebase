import { Model, PassportLocalModel } from 'mongoose';
import TaskModel, { TaskDocument } from './task.model';
import UserModel, { UserDocument } from './user.model';
import ClientModel, { ClientDocument } from './client.model';
import VerificationTokenModel, {
  VerificationTokenDocumnet,
} from './verification-token.model';
import SlackOAuthAccessModel, {
  ISlackOAuthAccessDocument,
} from './slack-oauth-access.model';

export interface IDbModels {
  TaskModel: Model<TaskDocument>;
  UserModel: PassportLocalModel<UserDocument>;
  VerificationTokenModel: Model<VerificationTokenDocumnet>;
  ClientModel: Model<ClientDocument>;
  SlackOAuthAccessModel: Model<ISlackOAuthAccessDocument>;
}
export const models: IDbModels = {
  TaskModel,
  UserModel,
  VerificationTokenModel,
  ClientModel,
  SlackOAuthAccessModel,
};
