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
  coverDraftKey?: string,
): GalleryImage[] {
  const selectedIndex = coverDraftKey
    ? drafts.findIndex(draft => (draft.imageId ?? draft.previewUrl) === coverDraftKey)
    : -1;
  const savedCoverIndex = coverImageId
    ? drafts.findIndex(draft => draft.imageId === coverImageId)
    : -1;
  const coverIndex =
    selectedIndex >= 0 ? selectedIndex : savedCoverIndex >= 0 ? savedCoverIndex : 0;

  return drafts.map((draft, index) => ({
    key: `${draft.imageId ?? draft.previewUrl ?? 'image'}-${index}`,
    previewUrl: draft.previewUrl,
    imageId: draft.imageId,
    isCover: drafts.length > 0 && index === coverIndex,
  }));
}
