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

export type DeletedObjectDTO = IChangeableObjectDTO;

/**
 * Union of all changeable objects including deleted
 */
export type ChangeableObjectDTO = TaskDTO | TagDTO | DeletedObjectDTO;

/**
 * Change DTO - represents a single change/sync event
 */
export interface ChangeDTO {
  entity: EChangedEntity;
  action: EChangeAction;
  object: ChangeableObjectDTO;
}
