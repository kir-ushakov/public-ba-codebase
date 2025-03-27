export interface CreateTaskRequestDTO {
  userId: string;
  id: string;
  type: string;
  title: string;
  status: string;
  imageUri?: string;
  createdAt: Date;
  modifiedAt: Date;
}
