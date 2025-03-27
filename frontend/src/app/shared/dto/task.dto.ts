export interface TaskDTO {
  id: string;
  userId: string;
  type: string;
  title: string;
  status: string;
  imageUri?: string;
  createdAt: string;
  modifiedAt: string;
}
