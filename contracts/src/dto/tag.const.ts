/**
 * Shared Tag limits and the fixed color palette.
 * Numbers and palette values only — no clipping, no Guard.
 */
export const TagConst = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 40,
  DEFAULT_COLOR: '#00a991',
  COLORS: [
    '#00a991',
    '#668fa8',
    '#9b8ad0',
    '#d6a34a',
    '#d95c5c',
    '#80b96b',
    '#86adb2',
    '#d68aa8',
    '#e87d45',
  ],
} as const;

/** Returns the palette value for a known color, ignoring case and surrounding space. */
export function canonicalTagColor(color: string | undefined | null): string | undefined {
  if (typeof color !== 'string') {
    return undefined;
  }
  const needle = color.trim().toLowerCase();
  return TagConst.COLORS.find(item => item === needle);
}
