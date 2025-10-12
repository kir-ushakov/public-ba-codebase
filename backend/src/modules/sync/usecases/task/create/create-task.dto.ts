import { TaskDTO } from "../../../domain/dtos/task.dto";

export interface CreateTaskRequestDTO {
  id: string;
  type: string;
  title: string;
  status: string;
  imageId?: string;
}

export type CreateTaskResponseDTO = TaskDTO;