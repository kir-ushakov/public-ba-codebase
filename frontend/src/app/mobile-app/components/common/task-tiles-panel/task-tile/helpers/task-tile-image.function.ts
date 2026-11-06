import { ImageConst } from '@brainassistant/contracts';
import { API_ENDPOINTS } from 'src/app/shared/constants/api-endpoints.const';

/**
 * CSS width of the tile photo. The shell caps the app at 768 / 960 / 1140 / 1320,
 * the home list is two columns with 16px page padding and a 12px gap, and the
 * photo sits inside a 1px border and 12px of tile padding.
 */
export const TASK_TILE_IMAGE_SIZES =
  '(min-width: 1920px) 612px, (min-width: 1440px) 522px, (min-width: 1024px) 432px, (min-width: 768px) 336px, calc((100vw - 44px) / 2 - 26px)';

// 480 covers a phone tile at 3x. 960 covers the tablet and the desktop shell at 2x.
// 1600 is the stored long edge, used only when the slot needs more than 960 device pixels.
// eslint-disable-next-line no-magic-numbers -- steps below the stored long edge
const TILE_IMAGE_WIDTHS = [480, 960, ImageConst.MAX_LONG_EDGE_PX] as const;

export type RemoteTaskTileImage = {
  src: string;
  srcset: string;
  sizes: string;
};

export function remoteTaskTileImage(id: string): RemoteTaskTileImage | null {
  if (id.length === 0 || /[\s,"']/.test(id)) {
    return null;
  }

  const base = `${API_ENDPOINTS.FILES.IMAGE}/${encodeURIComponent(id)}`;
  return {
    src: `${base}?width=${TILE_IMAGE_WIDTHS[1]}`,
    srcset: TILE_IMAGE_WIDTHS.map(width => `${base}?width=${width} ${width}w`).join(', '),
    sizes: TASK_TILE_IMAGE_SIZES,
  };
}

/** Same pick the browser makes from the srcset widths: smallest candidate that covers cssPx * dpr. */
export function taskTileImageWidth(cssPx: number, dpr: number): number {
  const target = cssPx * dpr;
  return TILE_IMAGE_WIDTHS.find(width => width >= target) ?? ImageConst.MAX_LONG_EDGE_PX;
}
