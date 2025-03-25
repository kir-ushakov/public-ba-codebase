export interface CreateTaskRequestDTO {
  userId: string;
  id: string;
  type: string;
  title: string;
  status: string;
  createdAt: Date;
  modifiedAt: Date;
}
