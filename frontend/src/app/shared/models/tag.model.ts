import { canonicalTagColor, TagConst } from '@brainassistant/contracts';

export type Tag = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  modifiedAt: string;
  /** Absent on tags saved before pinning. Treat anything other than true as unpinned. */
  isPinned?: boolean;
};

/** Default tag color. Stored colors outside the palette display as this teal. */
export const TAG_COLOR = TagConst.DEFAULT_COLOR;

export function displayTagColor(color: string | undefined | null): string {
  return canonicalTagColor(color) ?? TAG_COLOR;
}
