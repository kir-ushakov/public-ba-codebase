import { formatAttachedImageCount } from 'src/app/mobile-app/components/screens/task-screen/task-edit/helpers/format-attached-image-count.function';

describe('formatAttachedImageCount', () => {
  it('hides the count when nothing is attached', () => {
    expect(formatAttachedImageCount(0)).toBeNull();
  });

  it('uses the singular for one image', () => {
    expect(formatAttachedImageCount(1)).toBe('1 image');
  });

  it('uses the plural for more than one image', () => {
    expect(formatAttachedImageCount(3)).toBe('3 images');
  });
});
