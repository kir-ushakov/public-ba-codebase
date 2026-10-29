import { ImageConst } from '@brainassistant/contracts';

describe('ImageConst.ENCODE_PLAN', () => {
  it('follows the shared quality steps, then the long-edge drops', () => {
    const plan: Array<readonly [number, number]> = [
      [ImageConst.MAX_LONG_EDGE_PX, ImageConst.WEBP_QUALITY],
      [ImageConst.MAX_LONG_EDGE_PX, ImageConst.WEBP_QUALITY_STEP_2],
      [ImageConst.MAX_LONG_EDGE_PX, ImageConst.WEBP_QUALITY_STEP_3],
      [ImageConst.FALLBACK_LONG_EDGE_PX, ImageConst.WEBP_QUALITY_STEP_2],
    ];

    for (
      let quality = ImageConst.WEBP_QUALITY_STEP_2 - ImageConst.WEBP_QUALITY_DROP;
      quality >= ImageConst.MIN_WEBP_QUALITY;
      quality -= ImageConst.WEBP_QUALITY_DROP
    ) {
      plan.push([ImageConst.FALLBACK_LONG_EDGE_PX, quality]);
    }

    for (
      let longEdge = ImageConst.FALLBACK_LONG_EDGE_PX - ImageConst.LONG_EDGE_DROP_PX;
      longEdge >= ImageConst.MIN_LONG_EDGE_PX;
      longEdge -= ImageConst.LONG_EDGE_DROP_PX
    ) {
      plan.push([longEdge, ImageConst.MIN_WEBP_QUALITY]);
    }

    expect(ImageConst.ENCODE_PLAN).toEqual(plan);
  });

  it('keeps the store budget at 500 KiB and a 1600 px long edge', () => {
    expect(ImageConst.MAX_BYTES).toBe(500 * 1024);
    expect(ImageConst.MAX_LONG_EDGE_PX).toBe(1600);
  });
});
