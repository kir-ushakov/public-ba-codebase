import { Task } from './task.model';
import { Tag } from './tag.model';

export enum EChangedEntity {
  Task = 'CHANGED_ENTITY_TASK',
  Tag = 'CHANGED_ENTITY_TAG',
  // more types will be here
}

export enum EChangeAction {
  Created = 'CHANGE_ACTION_CREATED',
  Updated = 'CHANGE_ACTION_UPDATED',
  Deleted = 'CHANGE_ACTION_DELETED',
}

export type Change = {
  entity: EChangedEntity;
  action: EChangeAction;
  modifiedAt?: string;
  object?: IChangeableObject;
};

export interface IChangeableObject {
  id: string;
  modifiedAt: string;
}

export type ChangeableObject = (Task | Tag) & IChangeableObject;
