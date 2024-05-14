import { IMailgunClient } from 'mailgun.js/Interfaces';
import { IMailAdapter } from '../mail-adapter.interface';

export class MailgunAdapter implements IMailAdapter {
  private _provider: IMailgunClient;

  constructor(mailgunProvider: IMailgunClient) {
    this._provider = mailgunProvider;
  }

  public async sendEmail(
    to: string,
    from: string,
    subject: string,
    html: string
  ): Promise<void> {
    try {
      const result = await this._provider.messages.create(
        process.env.EMAIL_DOMAIN,
        {
          from: from,
          to: [to],
          subject: subject,
          html: html,
        }
      );
      console.log(result);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
