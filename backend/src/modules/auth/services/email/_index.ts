import { sendgridMailAdapter, mailgunAdapter } from './adapters/_index';
import {
  simpleMailFactory,
  christmasMailFactory,
  halloweenMailFactory,
} from './factories/_index';
import { EmailVerificationService } from './email-verification.service';
import { IAbstractMailFactory } from './abstract-mail-factory.interface';

let mailAdapter;
switch (process.env.MAIL_API) {
  case 'MAILGUN':
    mailAdapter = mailgunAdapter;
  case 'SENDGRID':
    mailAdapter = sendgridMailAdapter;

  // other adapters can be added here
  // ....

  default:
    mailAdapter = mailgunAdapter;
}

let mailFactory: IAbstractMailFactory;

if (new Date().getMonth() === 11 && new Date().getDate() === 25) {
  mailFactory = christmasMailFactory;
} else if (new Date().getMonth() === 9 && new Date().getDate() === 31) {
  mailFactory = halloweenMailFactory;
} else {
  mailFactory = simpleMailFactory;
}

const emailVerificationService = new EmailVerificationService(
  mailAdapter,
  mailFactory
);

export { emailVerificationService };
