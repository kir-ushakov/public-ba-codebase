import { Task } from './task.model';
import { Tag } from './tag.model';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';

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
