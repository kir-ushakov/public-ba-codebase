import { ITaskProps } from '../../../../shared/domain/models/task.js';

// For this moment Task DTO interface is identical Task Persistent interface
export interface TaskDTO extends ITaskProps {
  id: string;
}
