import { SendgridMailAdapter } from './sendgrid.adapter.js';
import { mailgunProvider, sendgridMailProvider } from '../providers/_index.js';
import { MailgunAdapter } from './mailgun.adapter.js';

const sendgridMailAdapter: SendgridMailAdapter = new SendgridMailAdapter(
  sendgridMailProvider
);
const mailgunAdapter: MailgunAdapter = new MailgunAdapter(mailgunProvider);

export { sendgridMailAdapter, mailgunAdapter };
