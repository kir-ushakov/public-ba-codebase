import { formatTaskTileDate } from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/helpers/format-task-tile-date.function';

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
});
