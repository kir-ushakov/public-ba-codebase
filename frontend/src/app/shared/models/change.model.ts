import { Task } from './task.model';
import { Tag } from './tag.model';

/**  
  TODO: Need to refactor Change
  TICKET:  https://brainas.atlassian.net/browse/BA-111
  export interface Change {
    entity: EntityTypes (Task, Tag,...);
    action: CREATED, UPDATED, DELETED - POST, PUT, DELETE...
    id: string
    modifiedAt: Date
    data?: ChangeableObject; // no need for DELETED action
}
*/
export type Change = {
  type: EChangeType;
  object: ChangeableObject;
};

export enum EChangeType {
  TaskCreated = 'CHANGE_TYPE_TASK_CREATED',
  TaskModified = 'CHANGE_TYPE_TASK_MODIFIED',
  TaskDeleted = 'CHANGE_TYPE_TASK_DELETED',
}

export interface IChangeableObject {
  id: string;
  modifiedAt: Date;
}

export type ChangeableObject = (Task | Tag) & IChangeableObject;
