import { ETaskStatus } from '../enums/task-status.enum';
import { ETaskType } from '../enums/task-type.enum';

/**
 * Task Data Transfer Object
 * Shared contract between frontend and backend for task data
 */
export interface TaskDTO {
  id: string;
  userId: string;
  type: ETaskType;
  title: string;
  status: ETaskStatus;
  imageId?: string;
  createdAt: string;
  modifiedAt: string;
}
