import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { requiredEnv } from '../../../../../config/index.js';

const mailgun = new Mailgun(FormData);

const mailgunProvider = mailgun.client({
  username: 'api',
  key: requiredEnv('MAILGUN_API_KEY'),
});

export { mailgunProvider };
