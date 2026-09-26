import type { DraftTaskImage } from '../../task-screen.state';

export type GalleryImage = {
  key: string;
  previewUrl?: string;
  imageId?: string;
  isCover: boolean;
};

export function toGalleryImages(
  drafts: readonly DraftTaskImage[],
  coverImageId?: string,
): GalleryImage[] {
  return drafts.map((draft, index) => ({
    key: `${draft.imageId ?? draft.previewUrl ?? 'image'}-${index}`,
    previewUrl: draft.previewUrl,
    imageId: draft.imageId,
    isCover: coverImageId ? draft.imageId === coverImageId : index === 0,
  }));
}
