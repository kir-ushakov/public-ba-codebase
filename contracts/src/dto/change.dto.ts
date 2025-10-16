/**
 * Change/Sync DTOs
 * Shared contracts for the sync system between frontend and backend
 */

import { TaskDTO } from './task.dto';
import { TagDTO } from './tag.dto';
import { EChangedEntity } from '../enums/changed-entity.enum';
import { EChangeAction } from '../enums/change-action.enum';

/**
 * Base interface for objects that can be synchronized
 * All changeable objects must have id and modifiedAt
 */
export interface IChangeableObjectDTO {
  id: string;
  modifiedAt: string;
}

/**
 * Union type of all DTOs that can be synchronized
 * Add new syncable types here
 */
export type ChangeableModelDTO = TaskDTO | TagDTO;

/**
 * ChangeableObjectDTO - union of all changeable objects
 */
export type ChangeableObjectDTO = (TaskDTO | TagDTO) & IChangeableObjectDTO;

/**
 * For deleted entities, we only need the id
 */
export type DeletedEntityDTO = Pick<IChangeableObjectDTO, 'id'>;

/**
 * Change DTO - represents a single change/sync event
 */
export interface ChangeDTO {
  entity: EChangedEntity;
  action: EChangeAction;
  object: ChangeableObjectDTO | DeletedEntityDTO;
}

