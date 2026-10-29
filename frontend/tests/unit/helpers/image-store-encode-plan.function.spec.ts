import { ImageConst } from '@brainassistant/contracts';
import { imageStoreEncodePlan } from 'src/app/shared/helpers/image-store-encode-plan.function';

describe('imageStoreEncodePlan', () => {
  it('tries the agreed quality steps before shrinking the long edge', () => {
    const plan = imageStoreEncodePlan();

    expect(plan[0]).toEqual({
      longEdge: ImageConst.MAX_LONG_EDGE_PX,
      quality: ImageConst.WEBP_QUALITY,
    });
    expect(plan[1]).toEqual({
      longEdge: ImageConst.MAX_LONG_EDGE_PX,
      quality: ImageConst.WEBP_QUALITY_STEP_2,
    });
    expect(plan[2]).toEqual({
      longEdge: ImageConst.MAX_LONG_EDGE_PX,
      quality: ImageConst.WEBP_QUALITY_STEP_3,
    });
    expect(plan[3]).toEqual({
      longEdge: ImageConst.FALLBACK_LONG_EDGE_PX,
      quality: ImageConst.WEBP_QUALITY_STEP_2,
    });
  });

  it('ends at the minimum long edge and quality', () => {
    const plan = imageStoreEncodePlan();

    expect(plan[plan.length - 1]).toEqual({
      longEdge: ImageConst.MIN_LONG_EDGE_PX,
      quality: ImageConst.MIN_WEBP_QUALITY,
    });
  });

  it('keeps the store budget at 500 KiB and a 1600 px long edge', () => {
    expect(ImageConst.MAX_BYTES).toBe(500 * 1024);
    expect(ImageConst.MAX_LONG_EDGE_PX).toBe(1600);
  });
});
