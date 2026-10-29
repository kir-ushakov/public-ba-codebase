import { ImageConst } from '@brainassistant/contracts';

/** Lossy WebP encode steps. The backend copy of this function must stay in step. */
export type ImageStoreEncodeAttempt = {
  longEdge: number;
  quality: number;
};

export function imageStoreEncodePlan(): ImageStoreEncodeAttempt[] {
  const plan: ImageStoreEncodeAttempt[] = [
    { longEdge: ImageConst.MAX_LONG_EDGE_PX, quality: ImageConst.WEBP_QUALITY },
    { longEdge: ImageConst.MAX_LONG_EDGE_PX, quality: ImageConst.WEBP_QUALITY_STEP_2 },
    { longEdge: ImageConst.MAX_LONG_EDGE_PX, quality: ImageConst.WEBP_QUALITY_STEP_3 },
    { longEdge: ImageConst.FALLBACK_LONG_EDGE_PX, quality: ImageConst.WEBP_QUALITY_STEP_2 },
  ];

  for (
    let quality = ImageConst.WEBP_QUALITY_STEP_2 - ImageConst.WEBP_QUALITY_DROP;
    quality >= ImageConst.MIN_WEBP_QUALITY;
    quality -= ImageConst.WEBP_QUALITY_DROP
  ) {
    plan.push({ longEdge: ImageConst.FALLBACK_LONG_EDGE_PX, quality });
  }

  for (
    let longEdge = ImageConst.FALLBACK_LONG_EDGE_PX - ImageConst.LONG_EDGE_DROP_PX;
    longEdge >= ImageConst.MIN_LONG_EDGE_PX;
    longEdge -= ImageConst.LONG_EDGE_DROP_PX
  ) {
    plan.push({ longEdge, quality: ImageConst.MIN_WEBP_QUALITY });
  }

  return plan;
}
