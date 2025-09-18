export interface IUpdateTaskRequestDTO {
  userId: string;
  id: string;
  type: string;
  title: string;
  status: string;
  imageId?: string;
  createdAt: string;
  modifiedAt: string;
}
