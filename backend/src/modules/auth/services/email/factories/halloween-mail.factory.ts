import { UserDocument } from '../../../../../shared/infra/database/mongodb/user.model';
import { IAbstractMailFactory } from '../abstract-mail-factory.interface';

export class HalloweenMailFactory implements IAbstractMailFactory {
  constructor() {}

  verificationEmail(user, link: string): string {
    const html = `  
      <p>Eat, drink and be scary, ${user.firstName} ${user.lastName},</p>
      <br>
      <p>Please click on the following <a href="${link}">link</a> to verify your account.</p> 
      <br>
      <p>If you did not request this, please ignore this email.</p>`;

    return html;
  }

  restorePasswordEmail(user, link: string): string {
    // TODO
    const html = '';
    return html;
  }

  notificationEmail(user: UserDocument, notification: any): string {
    // TODO
    const html = '';
    return html;
  }
}
