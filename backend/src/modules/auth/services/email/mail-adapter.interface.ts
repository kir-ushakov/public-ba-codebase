export interface IMailAdapter {
  sendEmail: (to: string, from: string, subject: string, html: string) => Promise<void>;
}
