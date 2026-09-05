import { ESlackEventType } from '../../enums/slack-event.enum.js';

/**
 * These are just the event types and properties that I use in my code.
 * the full list here https://api.slack.com/events
 */
export type SlackEvent = {
  type: ESlackEventType;
};

export type AppUninstalledSlackEvent = SlackEvent;

export type MemberLeftChannelSlackEvent = SlackEvent & {
  channel: string;
  user: string;
};

export type AppHomeOpenedSlackEvent = SlackEvent & {
  event_ts: number;
  user: string;
};

export type SlackEventReceivedReqestDTO = {
  team_id: string;
  event: SlackEvent;
};
