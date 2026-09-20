import { TaskConst } from '@brainassistant/contracts';

const VOICE_TASK_TITLE_ELLIPSIS = '...';
const VOICE_TASK_TITLE_PLAIN_MAX_LENGTH =
  TaskConst.TITLE_MAX_LENGTH - VOICE_TASK_TITLE_ELLIPSIS.length;

export function clipVoiceTaskTitle(text: string): string {
  if (text.length <= TaskConst.TITLE_MAX_LENGTH) {
    return text;
  }

  return `${text.slice(0, VOICE_TASK_TITLE_PLAIN_MAX_LENGTH)}${VOICE_TASK_TITLE_ELLIPSIS}`;
}
