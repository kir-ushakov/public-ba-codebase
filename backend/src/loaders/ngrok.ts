import ngrok, { Listener } from '@ngrok/ngrok';

export function establishIngress() {
  return new Promise<void>((resolve, reject) => {
    // Establish connectivity
    ngrok
      .forward({
        domain: process.env.NGROK_STATIC_DOMAIN,
        addr: process.env.NGROK_FORWARD_PATH,
        authtoken_from_env: true,
        verify_webhook_provider: 'slack',
        verify_webhook_secret: process.env.SLACK_SIGNING_SECRET,
      })
      .then((listener: Listener) => {
        console.log(`Ingress established at: ${listener.url()}`);
        ngrok.consoleLog();
        resolve();
      })
      .catch((err) => {
        console.log(
          `An error occurred while establishing of the ngrok ingress.`
        );
        reject(err);
      });
  });
}
