/**
 * Task Data Transfer Object
 * Shared contract between frontend and backend for task data
 */
export interface TaskDTO {
  id: string;
  userId: string;
  type: string;
  title: string;
  status: string;
  imageId?: string;
  createdAt: string;
  modifiedAt: string;
}

