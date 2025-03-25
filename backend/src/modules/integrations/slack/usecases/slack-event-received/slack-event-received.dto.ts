import { ESlackEventType } from '../../enums/slack-event.enum.js';

/**
 * These are just the event types and properties that I use in my code.
 * the full list here https://api.slack.com/events
 */
export interface SlackEvent {
  type: ESlackEventType;
}

export interface AppUninstalledSlackEvent extends SlackEvent {}

export interface MemberLeftChannelSlackEvent extends SlackEvent {
  channel: string;
  user: string;
}

export interface AppHomeOpenedSlackEvent extends SlackEvent {
  event_ts: number;
  user: string;
}

export interface SlackEventReceivedReqestDTO {
  team_id: string;
  event: SlackEvent;
}
