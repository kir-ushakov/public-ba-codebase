import type { HomeContentMode } from './home-content-mode.function';

export type HomeEmptyState = {
  title: string;
  body: string;
  illustration: string;
};

const EMPTY_STATES: Record<HomeContentMode, HomeEmptyState> = {
  active: {
    title: 'Nothing active right now.',
    body: 'Pick a task from your to do list or create a new one to get started.',
    illustration: 'assets/ui/empty/empty-active.svg',
  },
  todo: {
    title: 'Your to-do list is empty.',
    body: 'Add a new task, capture an idea or move something from notes.',
    illustration: 'assets/ui/empty/empty-todo.svg',
  },
  notes: {
    title: 'No notes yet.',
    body: 'Capture ideas, links, images or anything you want to remember for later.',
    illustration: 'assets/ui/empty/empty-notes.svg',
  },
};

export function homeEmptyState(mode: HomeContentMode): HomeEmptyState {
  return EMPTY_STATES[mode];
}
