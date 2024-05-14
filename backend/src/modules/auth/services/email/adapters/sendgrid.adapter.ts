import { MailDataRequired, MailService } from '@sendgrid/mail';
import { IMailAdapter } from '../mail-adapter.interface';

export class SendgridMailAdapter implements IMailAdapter {
  private _provider: MailService;

  constructor(sendgridMailProvider: MailService) {
    this._provider = sendgridMailProvider;
  }

  public async sendEmail(
    to: string,
    from: string,
    subject: string,
    html: string
  ): Promise<void> {
    let mail: MailDataRequired = {
      from,
      subject,
      to,
      html,
    };

    try {
      await this._provider.send(mail);
    } catch (error) {
      // TODO: log error here
      const { message, code, response } = error;
      const { headers, body } = response;
      console.error(body);
    }
  }
}
