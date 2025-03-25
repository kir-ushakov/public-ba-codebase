import { TaskDTO } from './task.dto.js';

export interface IChangeableObjectDTO {
  id: string;
  modifiedAt: string;
}

type DeletedEntityDTO = IChangeableObjectDTO;

export type ChangeableModelDTO = TaskDTO | DeletedEntityDTO;

export interface ChangeDTO {
  entity: string;
  action: string;
  object: ChangeableModelDTO;
  entityId: string;
}
