import { UserDocument } from '../../../../shared/infra/database/mongodb/user.model';

export interface IAbstractMailFactory {
  verificationEmail(user: UserDocument, link: string): string;
  restorePasswordEmail(user: UserDocument, link: string): string;
  notificationEmail(user: UserDocument, notification: any): string;
}
