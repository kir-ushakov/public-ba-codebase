/**
 * Shared Task limits. Both apps must enforce these on write.
 * Numbers only — no validation, no clipping, no Guard.
 */
export const TaskConst = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_TEXT_LENGTH: 4000,
  DESCRIPTION_MAX_JSON_BYTES: 16384,
  DESCRIPTION_MAX_DEPTH: 8,
} as const;
