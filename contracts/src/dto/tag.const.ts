/**
 * Shared Tag limits. Both apps must enforce these on write.
 * Numbers only — no validation, no clipping, no Guard.
 */
export const TagConst = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 40,
} as const;
