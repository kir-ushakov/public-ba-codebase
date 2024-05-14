import { UserDocument } from '../../../../shared/infra/database/mongodb/user.model';
import { VerificationTokenDocumnet } from '../../../../shared/infra/database/mongodb/verification-token.model';
import { IMailAdapter } from './mail-adapter.interface';
import { IAbstractMailFactory } from './abstract-mail-factory.interface';

export class EmailVerificationService {
  public static MESSAGES = {
    EMAIL_VERIFICATION: 'Account Verification Token',
  };

  private _adapter: IMailAdapter;
  private _mailFactory: IAbstractMailFactory;

  constructor(mailAdapter: IMailAdapter, mailFactory: IAbstractMailFactory) {
    this._adapter = mailAdapter;
    this._mailFactory = mailFactory;
  }

  public async sendVerificationEmail(user: UserDocument) {
    try {
      const token: VerificationTokenDocumnet = user.generateVerificationToken();
      await token.save();

      const subject = EmailVerificationService.MESSAGES.EMAIL_VERIFICATION;
      const to = user.username;
      const from = `mail@${process.env.EMAIL_DOMAIN}`;

      const link = `${process.env.HOST}/api/auth/verify-email?token=${token.token}`;
      const html = this._mailFactory.verificationEmail(user, link);
      await this._adapter.sendEmail(to, from, subject, html);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
