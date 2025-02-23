import { MailService } from '@sendgrid/mail';

const sendgridApiKey = process.env.SENDGRID_API_KEY;
const sendgridMailProvider: MailService = new MailService();
sendgridMailProvider.setApiKey(sendgridApiKey);

export { sendgridMailProvider };
