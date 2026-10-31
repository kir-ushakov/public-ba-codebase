import {
  formatTaskTileDate,
  msUntilNextLocalMidnight,
  taskTileDayKey,
} from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/helpers/format-task-tile-date.function';

describe('formatTaskTileDate', () => {
  it('formats a date on the same local day as Today with 24-hour time', () => {
    const now = new Date(2026, 8, 19, 20, 30, 0);
    const createdAt = new Date(2026, 8, 19, 10, 24, 0).toISOString();

    expect(formatTaskTileDate(createdAt, now)).toBe('Today, 10:24');
  });

  it('formats an older date as a short month day year', () => {
    const now = new Date(2026, 8, 19, 20, 30, 0);
    const createdAt = new Date(2026, 8, 11, 12, 0, 0).toISOString();

    expect(formatTaskTileDate(createdAt, now)).toBe('Sep 11, 2026');
  });

  it('keeps the English short date when the locale argument is en-US', () => {
    const now = new Date(2026, 8, 19, 20, 30, 0);
    const createdAt = new Date(2026, 8, 11, 12, 0, 0).toISOString();

    expect(formatTaskTileDate(createdAt, now, 'en-US')).toBe('Sep 11, 2026');
  });

  it('moves the day key at local midnight', () => {
    expect(taskTileDayKey(new Date(2026, 8, 19, 23, 59))).toBe('2026-9-19');
    expect(taskTileDayKey(new Date(2026, 8, 20, 0, 0))).toBe('2026-9-20');
  });

  it('waits until the next local midnight', () => {
    expect(msUntilNextLocalMidnight(new Date(2026, 8, 19, 22, 0, 0))).toBe(2 * 60 * 60 * 1000);
    expect(msUntilNextLocalMidnight(new Date(2026, 8, 19, 23, 59, 59, 500))).toBe(1000);
  });
});
