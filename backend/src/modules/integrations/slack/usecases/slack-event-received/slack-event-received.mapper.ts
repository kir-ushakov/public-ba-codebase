import type { SlackEventReceivedParams } from './slack-event-received.usecase.js';
import type { SlackEventReceivedReqestDTO } from './slack-event-received.dto.js';

export function requestToUsecaseParams(payload: SlackEventReceivedReqestDTO): SlackEventReceivedParams {
  return payload;
}

