export interface IMailAdapter {
  sendEmail: (to, from, subject, html) => Promise<void>;
}
