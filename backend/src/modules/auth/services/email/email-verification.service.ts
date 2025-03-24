import { UserDocument } from '../../../../shared/infra/database/mongodb/user.model.js';
import { VerificationTokenDocument } from '../../../../shared/infra/database/mongodb/verification-token.model.js';
import { IMailAdapter } from './mail-adapter.interface.js';
import { IAbstractMailFactory } from './abstract-mail-factory.interface.js';

export class EmailVerificationService {
  public static MESSAGES = {
    EMAIL_VERIFICATION: 'Account Verification Token',
  };

  private _adapter: IMailAdapter;
  private _mailFactory: IAbstractMailFactory;

  constructor(mailAdapter: IMailAdapter, mailFactory: IAbstractMailFactory) {
    // 👇 adapter instance to interact with 3rd party mailing API
    this._adapter = mailAdapter;
    // 👇 dependency class to generate content of email
    this._mailFactory = mailFactory;
  }

  public async sendVerificationEmail(user: UserDocument) {
    try {
      // 👇 generate and save in DB unique verification token
      const token: VerificationTokenDocument = user.generateVerificationToken();
      await token.save();

      // 👇  prepare sending email parameters
      const subject = EmailVerificationService.MESSAGES.EMAIL_VERIFICATION;
      const to = user.username;
      const from = `mail@${process.env.EMAIL_DOMAIN}`;

      // 👇 generate email html with verification link
      const link = `${process.env.HOST}/api/auth/verify-email?token=${token.token}`;
      const html = this._mailFactory.verificationEmail(user, link);

      // 👇 send email using 3rd-party API
      await this._adapter.sendEmail(to, from, subject, html);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
