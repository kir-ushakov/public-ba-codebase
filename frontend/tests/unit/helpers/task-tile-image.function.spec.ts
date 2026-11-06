import { taskTileImageWidth } from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/helpers/task-tile-image.function';

describe('taskTileImageWidth', () => {
  it('picks 480 for a phone tile even at a high pixel density', () => {
    expect(taskTileImageWidth(140, 1)).toBe(480);
    expect(taskTileImageWidth(140, 3)).toBe(480);
  });

  it('picks 960 for a tablet or the desktop shell at double density', () => {
    expect(taskTileImageWidth(336, 2)).toBe(960);
    expect(taskTileImageWidth(432, 2)).toBe(960);
  });

  it('picks the stored long edge only when the slot needs more than 960 device pixels', () => {
    expect(taskTileImageWidth(612, 1)).toBe(960);
    expect(taskTileImageWidth(612, 2)).toBe(1600);
  });
});
