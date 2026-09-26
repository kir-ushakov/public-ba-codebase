import type { TaskDescriptionDoc, TaskDescriptionNode } from '@brainassistant/contracts';

export function taskDescriptionText(doc: TaskDescriptionDoc | null | undefined): string {
  if (doc === null || doc === undefined) {
    return '';
  }

  return collectText(doc);
}

export function isEmptyTaskDescription(doc: TaskDescriptionDoc | null | undefined): boolean {
  return taskDescriptionText(doc).trim().length === 0;
}

function collectText(node: TaskDescriptionDoc | TaskDescriptionNode): string {
  if ('text' in node && typeof node.text === 'string') {
    return node.text;
  }

  return (node.content ?? []).map(child => collectText(child)).join('');
}
