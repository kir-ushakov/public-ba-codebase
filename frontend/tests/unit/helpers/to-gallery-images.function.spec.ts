import { toGalleryImages } from 'src/app/mobile-app/components/screens/task-screen/task-edit/helpers/to-gallery-images.function';

describe('toGalleryImages', () => {
  const drafts = [{ imageId: 'cover-id' }, { previewUrl: 'blob:second' }];

  it('marks the saved cover when no tile has been clicked', () => {
    const images = toGalleryImages(drafts, 'cover-id');

    expect(images.map(image => image.isCover)).toEqual([true, false]);
  });

  it('marks the clicked tile even when it has no saved id yet', () => {
    const images = toGalleryImages(drafts, 'cover-id', 'blob:second');

    expect(images.map(image => image.isCover)).toEqual([false, true]);
  });

  it('keeps the first image as cover when nothing is selected', () => {
    const images = toGalleryImages([{ previewUrl: 'blob:first' }, { previewUrl: 'blob:second' }]);

    expect(images.map(image => image.isCover)).toEqual([true, false]);
  });
});
