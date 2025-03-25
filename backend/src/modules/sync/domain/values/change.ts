import { ValueObject } from '../../../../shared/domain/ValueObject.js';
import { ChangeableModelDTO } from '../dtos/change.dto.js';

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

export interface IChangeProps {
  entity: EChangedEntity;
  action: EChangeAction;
  object?: ChangeableModelDTO;
  modifiedAt?: string;
}

export class Change extends ValueObject<IChangeProps> {
  constructor(props: IChangeProps) {
    super(props);
  }
}
