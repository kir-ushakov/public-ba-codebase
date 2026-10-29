import type { HomeContentMode } from './home-content-mode.function';

export type HomeEmptyState = {
  title: string;
  body: string;
  symbol: string;
  viewBox: string;
};

const EMPTY_SPRITE = 'assets/ui/empty/empty-states.svg';

const EMPTY_STATES: Record<HomeContentMode, HomeEmptyState> = {
  active: {
    title: 'Nothing active right now.',
    body: 'Pick a task from your to do list or create a new one to get started.',
    symbol: `${EMPTY_SPRITE}#empty-active`,
    viewBox: '0 0 640 440',
  },
  todo: {
    title: 'Your to-do list is empty.',
    body: 'Add a new task, capture an idea or move something from notes.',
    symbol: `${EMPTY_SPRITE}#empty-todo`,
    viewBox: '0 0 640 440',
  },
  notes: {
    title: 'No notes yet.',
    body: 'Capture ideas, links, images or anything you want to remember for later.',
    symbol: `${EMPTY_SPRITE}#empty-notes`,
    viewBox: '0 0 520 400',
  },
};

export function homeEmptyState(mode: HomeContentMode): HomeEmptyState {
  return EMPTY_STATES[mode];
}
