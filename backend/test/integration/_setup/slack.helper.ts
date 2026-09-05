import crypto from 'crypto';

/**
 * Signs a JSON body the same way verification-challenge.function.ts does
 * after express.json() has already parsed the payload.
 */
export function slackSignatureForBody(
  body: unknown,
  timestamp: string,
  secret = process.env.SLACK_SIGNING_SECRET ?? 'test-slack-signing-secret',
): string {
  const rawBody = JSON.stringify(body)
    .replace(/\//g, '\\/')
    .replace(/[\u007f-\uffff]/g, c => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4));

  return (
    'v0=' + crypto.createHmac('sha256', secret).update(`v0:${timestamp}:${rawBody}`).digest('hex')
  );
}
