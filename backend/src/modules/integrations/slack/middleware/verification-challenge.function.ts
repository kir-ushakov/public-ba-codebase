import express from 'express';
import crypto from 'crypto';
import formurlencoded from 'form-urlencoded';

export function verificationChallenge() {
  return async (req: express.Request, res: express.Response, next) => {
    // the verification challenge to validate the endpoint (only used once)
    if (req.body.type === 'url_verification') {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(req.body.challenge);
    }

    // to be sure the sender is really Slack
    const xSlackSignatur: string = req.headers['x-slack-signature'] as string;
    const xSlackRequestTimestamp = req.headers['x-slack-request-timestamp'];
    const contentType = req.headers['content-type'];

    let rawBody;
    if (
      contentType?.toLocaleLowerCase() === 'application/x-www-form-urlencoded'
    ) {
      rawBody = formurlencoded(req.body);
    } else {
      rawBody = JSON.stringify(req.body)
        .replace(/\//g, '\\/')
        .replace(
          /[\u007f-\uffff]/g,
          (c) => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4)
        );
    }

    const sigBasestring = `v0:${xSlackRequestTimestamp}:${rawBody}`;
    const mySignature =
      'v0=' +
      crypto
        .createHmac('sha256', process.env.SLACK_SIGNING_SECRET)
        .update(sigBasestring)
        .digest('hex');

    if (
      crypto.timingSafeEqual(
        Buffer.from(mySignature, 'utf8'),
        Buffer.from(xSlackSignatur, 'utf8')
      )
    ) {
      next();
    } else {
      return res.status(400).send('Verifying requests from Slack failed');
    }

    return next();
  };
}
