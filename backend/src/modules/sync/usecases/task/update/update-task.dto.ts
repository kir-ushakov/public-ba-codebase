export interface IUpdateTaskRequestDTO {
  userId: string,
  id: string
  type: string,
  title: string,
  status: string,
  imageUri?: string,
  createdAt: string,
  modifiedAt: string,
}
