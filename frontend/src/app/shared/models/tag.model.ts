export type Tag = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  modifiedAt: string;
};

/** TagDTO.color is required. Create tag has no color picker, so new tags store the accent token. */
export const TAG_COLOR = '#00a991';
