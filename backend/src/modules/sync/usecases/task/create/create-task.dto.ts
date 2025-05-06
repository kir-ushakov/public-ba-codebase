export interface CreateTaskRequestDTO {
  id: string;
  type: string;
  title: string;
  status: string;
  imageUri?: string;
}
