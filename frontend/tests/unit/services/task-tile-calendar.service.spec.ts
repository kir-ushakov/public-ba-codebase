import { NgZone } from '@angular/core';
import {
  msUntilNextLocalMidnight,
  taskTileDayKey,
} from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/helpers/format-task-tile-date.function';
import { TaskTileCalendar } from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/task-tile-calendar.service';

type CapturedTimer = {
  callback: () => void;
  delay: number;
  cleared: boolean;
};

describe('TaskTileCalendar', () => {
  const RealDate = Date;
  let now: Date;
  let timers: CapturedTimer[];
  let restoreTimers: () => void;
  let calendar: TaskTileCalendar;
  let dateSpy: jest.SpyInstance;

  beforeEach(() => {
    now = new RealDate(2026, 9, 31, 23, 0, 0);
    timers = [];
    dateSpy = jest.spyOn(global, 'Date').mockImplementation((...args: unknown[]) => {
      if (args.length === 0) {
        return new RealDate(now.getTime());
      }
      return new RealDate(...(args as ConstructorParameters<typeof RealDate>));
    });
    restoreTimers = captureTimers(() => timers);
    calendar = new TaskTileCalendar(new NgZone({ enableLongStackTrace: false }));
  });

  afterEach(() => {
    calendar.release();
    calendar.release();
    calendar.release();
    restoreTimers();
    dateSpy.mockRestore();
    setVisibility('visible');
  });

  it('stops the single timer when the last tile is released', () => {
    calendar.retain();
    calendar.retain();
    expect(liveTimers(timers)).toHaveLength(1);

    calendar.release();
    expect(liveTimers(timers)).toHaveLength(1);

    calendar.release();
    expect(liveTimers(timers)).toHaveLength(0);
  });

  it('updates the shared day key at the next local midnight', () => {
    calendar.retain();
    expect(calendar.dayKey()).toBe(taskTileDayKey(now));
    const first = liveTimers(timers)[0];
    expect(first.delay).toBe(msUntilNextLocalMidnight(now));

    now = new RealDate(2026, 10, 1, 0, 0, 0);
    fire(first);

    expect(calendar.dayKey()).toBe(taskTileDayKey(now));
    const next = liveTimers(timers);
    expect(next).toHaveLength(1);
    expect(next[0].delay).toBe(msUntilNextLocalMidnight(now));
  });

  it('catches up the day key when the first tile returns after midnight', () => {
    calendar.retain();
    calendar.release();
    expect(liveTimers(timers)).toHaveLength(0);

    now = new RealDate(2026, 10, 1, 0, 30, 0);
    calendar.retain();

    expect(calendar.dayKey()).toBe(taskTileDayKey(now));
    expect(liveTimers(timers)).toHaveLength(1);
  });

  it('catches up when the page becomes visible after the timer was delayed', () => {
    calendar.retain();
    const delayed = liveTimers(timers)[0];

    now = new RealDate(2026, 10, 1, 1, 0, 0);
    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(calendar.dayKey()).toBe('2026-10-31');
    expect(delayed.cleared).toBe(false);

    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(calendar.dayKey()).toBe(taskTileDayKey(now));
    expect(delayed.cleared).toBe(true);
    expect(liveTimers(timers)).toHaveLength(1);
    expect(liveTimers(timers)[0].delay).toBe(msUntilNextLocalMidnight(now));
  });

  it('does not restart the timer after the last tile is gone', () => {
    calendar.retain();
    calendar.release();

    now = new RealDate(2026, 10, 1, 1, 0, 0);
    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(calendar.dayKey()).toBe('2026-10-31');
    expect(liveTimers(timers)).toHaveLength(0);
  });

  it('keeps the pending timer when the page returns on the same day', () => {
    calendar.retain();
    const pending = liveTimers(timers)[0];

    setVisibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(pending.cleared).toBe(false);
    expect(liveTimers(timers)).toEqual([pending]);
  });
});

function liveTimers(timers: CapturedTimer[]): CapturedTimer[] {
  return timers.filter(timer => !timer.cleared);
}

function fire(timer: CapturedTimer): void {
  timer.cleared = true;
  timer.callback();
}

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
}

function captureTimers(timers: () => CapturedTimer[]): () => void {
  const globals = globalThis as Record<string, unknown>;
  const zone = (globalThis as { Zone?: { __symbol__?: (key: string) => string } }).Zone;
  const setKey = zone?.__symbol__?.('setTimeout');
  const clearKey = zone?.__symbol__?.('clearTimeout');
  const originalSet = setKey ? globals[setKey] : undefined;
  const originalClear = clearKey ? globals[clearKey] : undefined;
  const originalGlobalSet = global.setTimeout;
  const originalGlobalClear = global.clearTimeout;

  const start = (callback: TimerHandler, delay?: number): number => {
    const captured = timers();
    captured.push({
      callback: callback as () => void,
      delay: delay ?? 0,
      cleared: false,
    });
    return captured.length;
  };
  const clear = (id: number): void => {
    const timer = timers()[id - 1];
    if (timer) {
      timer.cleared = true;
    }
  };

  if (setKey) {
    globals[setKey] = start;
  }
  if (clearKey) {
    globals[clearKey] = clear;
  }
  global.setTimeout = start as typeof setTimeout;
  global.clearTimeout = clear as typeof clearTimeout;

  return () => {
    if (setKey) {
      globals[setKey] = originalSet;
    }
    if (clearKey) {
      globals[clearKey] = originalClear;
    }
    global.setTimeout = originalGlobalSet;
    global.clearTimeout = originalGlobalClear;
  };
}
