import { Application } from 'express';
import request from 'supertest';
import SlackOAuthAccessModel from '../../../src/shared/infra/database/mongodb/slack-oauth-access.model.js';
import { ESlackEventType } from '../../../src/modules/integrations/slack/enums/slack-event.enum.js';
import { buildTestApp } from '../_setup/build-test-app.js';
import { clearDatabase, startInMemoryMongo, stopInMemoryMongo } from '../_setup/mongo-memory.js';
import { slackSignatureForBody } from '../_setup/slack.helper.js';

const EVENT_PATH = '/api/integrations/slack/event-recived';

describe('Integration: SlackEventReceived (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Application;

  beforeAll(async () => {
    await startInMemoryMongo();
    app = buildTestApp().app;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('answers Slack url_verification with the challenge string', async () => {
    const res = await request(app)
      .post(EVENT_PATH)
      .send({ type: 'url_verification', challenge: 'challenge-token-123' });

    expect(res.status).toBe(200);
    expect(res.text).toBe('challenge-token-123');
  });

  it('rejects events with a bad signature', async () => {
    const body = appUninstalledBody('T-BAD-SIG');
    const res = await request(app)
      .post(EVENT_PATH)
      .set('x-slack-request-timestamp', '1700000000')
      .set('x-slack-signature', 'v0=deadbeef')
      .send(body);

    expect(res.status).toBe(400);
    expect(res.text).toContain('Verifying requests from Slack failed');
  });

  it('rejects events without Slack signature headers', async () => {
    const res = await request(app).post(EVENT_PATH).send(appUninstalledBody('T-NO-HEADERS'));

    expect(res.status).toBe(400);
  });

  it('deletes Slack OAuth access on app_uninstalled', async () => {
    await seedOAuthAccess('T-UNINSTALL');

    const body = appUninstalledBody('T-UNINSTALL');
    const res = await signedPost(app, body);

    expect(res.status).toBe(200);
    expect(await SlackOAuthAccessModel.countDocuments({ teamId: 'T-UNINSTALL' })).toBe(0);
  });

  it('handles duplicate app_uninstalled deliveries idempotently', async () => {
    await seedOAuthAccess('T-DUP');
    const body = appUninstalledBody('T-DUP');

    const first = await signedPost(app, body);
    const second = await signedPost(app, body);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await SlackOAuthAccessModel.countDocuments({ teamId: 'T-DUP' })).toBe(0);
  });

  it('returns 400 for an unsupported Slack event type', async () => {
    const body = {
      team_id: 'T-UNSUPPORTED',
      event: { type: 'message' },
    };

    const res = await signedPost(app, body);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('name');
    expect(res.body.message).toContain('Is Not Supported');
  });

  it('acknowledges app_home_opened without mutating OAuth access', async () => {
    await seedOAuthAccess('T-HOME');
    const body = {
      team_id: 'T-HOME',
      event: {
        type: ESlackEventType.AppHomeOpened,
        user: 'U-HOME',
        event_ts: 1700000000.123,
      },
    };

    const res = await signedPost(app, body);

    expect(res.status).toBe(200);
    expect(await SlackOAuthAccessModel.countDocuments({ teamId: 'T-HOME' })).toBe(1);
  });
});

async function seedOAuthAccess(teamId: string): Promise<void> {
  await SlackOAuthAccessModel.create({
    _id: `oauth-${teamId}`,
    userId: `user-${teamId}`,
    accessToken: 'xoxb-test-token',
    authedUserId: 'U-AUTHED',
    slackBotUserId: 'B-BOT',
    teamId,
  });
}

function appUninstalledBody(teamId: string) {
  return {
    team_id: teamId,
    event: { type: ESlackEventType.AppUninstalled },
  };
}

async function signedPost(app: Application, body: object) {
  const timestamp = '1700000000';
  return request(app)
    .post(EVENT_PATH)
    .set('x-slack-request-timestamp', timestamp)
    .set('x-slack-signature', slackSignatureForBody(body, timestamp))
    .send(body);
}
