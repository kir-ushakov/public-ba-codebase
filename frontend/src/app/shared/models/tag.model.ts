export type Tag = {
  id: string;
  type: ETagType;
  name: string;
  color: string;
  createdAt: Date;
  modifiedAt: Date;
};

export enum ETagType {
  REGULAR = 'REGULAR_TAG',
  CATEGORY = 'CATEGORY_TAG',
}
