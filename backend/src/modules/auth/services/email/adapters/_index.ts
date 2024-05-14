import { SendgridMailAdapter } from './sendgrid.adapter';
import { mailgunProvider, sendgridMailProvider } from '../providers/_index';
import { MailgunAdapter } from './mailgun.adapter';

const sendgridMailAdapter: SendgridMailAdapter = new SendgridMailAdapter(
  sendgridMailProvider
);
const mailgunAdapter: MailgunAdapter = new MailgunAdapter(mailgunProvider);

export { sendgridMailAdapter, mailgunAdapter };
