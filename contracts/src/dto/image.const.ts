/**
 * Stored task-photo limits. Both apps must enforce these on write.
 *
 * Encode lossy WebP in this order: long edge MAX_LONG_EDGE_PX at WEBP_QUALITY,
 * then WEBP_QUALITY_STEP_2, then WEBP_QUALITY_STEP_3. If the file is still over
 * MAX_BYTES, use FALLBACK_LONG_EDGE_PX at WEBP_QUALITY_STEP_2, then lower quality
 * by WEBP_QUALITY_DROP down to MIN_WEBP_QUALITY, then lower the long edge by
 * LONG_EDGE_DROP_PX down to MIN_LONG_EDGE_PX.
 * A WebP already within MAX_LONG_EDGE_PX and MAX_BYTES is stored as-is.
 *
 * ENCODE_PLAN is that sequence as [longEdgePx, quality] pairs.
 * Numbers only — no validation, no clipping, no Guard.
 */
export const ImageConst = {
  MAX_LONG_EDGE_PX: 1600,
  FALLBACK_LONG_EDGE_PX: 1280,
  MIN_LONG_EDGE_PX: 640,
  LONG_EDGE_DROP_PX: 160,
  /** 500 × 1024 bytes. */
  MAX_BYTES: 512000,
  WEBP_QUALITY: 80,
  WEBP_QUALITY_STEP_2: 75,
  WEBP_QUALITY_STEP_3: 68,
  MIN_WEBP_QUALITY: 40,
  WEBP_QUALITY_DROP: 8,
  ENCODE_PLAN: [
    [1600, 80],
    [1600, 75],
    [1600, 68],
    [1280, 75],
    [1280, 67],
    [1280, 59],
    [1280, 51],
    [1280, 43],
    [1120, 40],
    [960, 40],
    [800, 40],
    [640, 40],
  ],
} as const;
