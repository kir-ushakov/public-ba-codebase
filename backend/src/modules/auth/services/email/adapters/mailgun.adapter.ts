import { IMailgunClient } from 'mailgun.js/Interfaces';
import { IMailAdapter } from '../mail-adapter.interface.js';

export class MailgunAdapter implements IMailAdapter {
  private provider: IMailgunClient;

  constructor(mailgunProvider: IMailgunClient) {
    this.provider = mailgunProvider;
  }

  public async sendEmail(
    to: string,
    from: string,
    subject: string,
    html: string
  ): Promise<void> {
    try {
      // 👇 Create email with MailGun API (provider is  MailgunClient)
      const result = await this.provider.messages.create(
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
