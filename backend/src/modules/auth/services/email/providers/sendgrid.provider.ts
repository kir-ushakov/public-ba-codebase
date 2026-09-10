import { MailService } from '@sendgrid/mail';
import { requiredEnv } from '../../../../../config/index.js';

const sendgridApiKey = requiredEnv('SENDGRID_API_KEY');
const sendgridMailProvider: MailService = new MailService();
sendgridMailProvider.setApiKey(sendgridApiKey);

export { sendgridMailProvider };
