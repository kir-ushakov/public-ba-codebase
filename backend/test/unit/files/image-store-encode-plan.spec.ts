import { ImageConst } from '@brainassistant/contracts';
import { imageStoreEncodePlan } from '../../../src/modules/files/services/image-store-encode-plan.function.js';

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
});
