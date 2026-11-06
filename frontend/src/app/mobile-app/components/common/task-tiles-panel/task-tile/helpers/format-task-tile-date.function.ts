function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

export const TASK_TILE_DATE_LOCALE = 'en-US';

export function taskTileDayKey(now: Date): string {
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export function msUntilNextLocalMidnight(now: Date): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.max(1_000, next.getTime() - now.getTime());
}

export function formatTaskTileDate(
  iso: string,
  now = new Date(),
  locale = TASK_TILE_DATE_LOCALE,
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  if (isSameLocalDay(date, now)) {
    return `Today, ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }

  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
