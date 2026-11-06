import { TaskConst, type TaskDescriptionDoc } from '@brainassistant/contracts';
import { isEmptyTaskDescription, taskDescriptionText } from './is-empty-task-description.function';

/**
 * Appends a transcript as its own paragraph.
 * Returns null when the combined text would pass the description limit, leaving the description unchanged.
 */
export function appendTranscriptionToDescription(
  current: TaskDescriptionDoc | null | undefined,
  text: string,
): TaskDescriptionDoc | null {
  const transcript = text.trim();
  if (!transcript) {
    return null;
  }

  const existing = isEmptyTaskDescription(current) ? '' : taskDescriptionText(current);
  if (existing.length + transcript.length > TaskConst.DESCRIPTION_MAX_TEXT_LENGTH) {
    return null;
  }

  const paragraph = {
    type: 'paragraph' as const,
    content: [{ type: 'text' as const, text: transcript }],
  };
  if (!current || isEmptyTaskDescription(current)) {
    return { type: 'doc', content: [paragraph] };
  }

  return {
    type: 'doc',
    content: [...(current.content ?? []), paragraph],
  };
}
