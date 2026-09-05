import express from 'express';
import crypto from 'crypto';
import formurlencoded from 'form-urlencoded';

export function verificationChallenge(): express.RequestHandler {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // the verification challenge to validate the endpoint (only used once)
    if (req.body.type === 'url_verification') {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(req.body.challenge);
    }

    // to be sure the sender is really Slack
    const xSlackSignatur: string = req.headers['x-slack-signature'] as string;
    const xSlackRequestTimestamp = req.headers['x-slack-request-timestamp'];
    const contentType = req.headers['content-type'];

    if (!xSlackSignatur || !xSlackRequestTimestamp) {
      return res.status(400).send('Verifying requests from Slack failed');
    }

    let rawBody;
    const contentTypeHeader = Array.isArray(contentType) ? contentType[0] : contentType;
    if (contentTypeHeader?.toLocaleLowerCase() === 'application/x-www-form-urlencoded') {
      rawBody = formurlencoded(req.body);
    } else {
      rawBody = JSON.stringify(req.body)
        .replace(/\//g, '\\/')
        .replace(
          /[\u007f-\uffff]/g,
          c => '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4),
        );
    }

    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      return res.status(400).send('Verifying requests from Slack failed');
    }

    const timestamp = Array.isArray(xSlackRequestTimestamp)
      ? xSlackRequestTimestamp[0]
      : xSlackRequestTimestamp;
    const sigBasestring = `v0:${String(timestamp)}:${rawBody}`;
    const mySignature =
      'v0=' + crypto.createHmac('sha256', signingSecret).update(sigBasestring).digest('hex');

    try {
      if (
        crypto.timingSafeEqual(
          Buffer.from(mySignature, 'utf8'),
          Buffer.from(xSlackSignatur, 'utf8'),
        )
      ) {
        return next();
      }
    } catch {
      // timingSafeEqual throws when buffer lengths differ
    }

    return res.status(400).send('Verifying requests from Slack failed');
  };
}
