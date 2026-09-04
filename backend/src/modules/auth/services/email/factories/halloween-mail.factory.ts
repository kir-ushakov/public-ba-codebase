import { UserDocument } from '../../../../../shared/infra/database/mongodb/user.model.js';
import { IAbstractMailFactory } from '../abstract-mail-factory.interface.js';

export class HalloweenMailFactory implements IAbstractMailFactory {
  constructor() {}

  verificationEmail(user: UserDocument, link: string): string {
    const html = `  
      <p>Eat, drink and be scary, ${user.firstName} ${user.lastName},</p>
      <br>
      <p>Please click on the following <a href="${link}">link</a> to verify your account.</p> 
      <br>
      <p>If you did not request this, please ignore this email.</p>`;

    return html;
  }

  restorePasswordEmail(_user: UserDocument, _link: string): string {
    // TODO
    const html = '';
    return html;
  }

  notificationEmail(_user: UserDocument, _notification: unknown): string {
    // TODO
    const html = '';
    return html;
  }
}
