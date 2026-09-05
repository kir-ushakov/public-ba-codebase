import { ValueObject } from '../../../../shared/domain/ValueObject.js';
import { ChangeableObjectDTO, EChangedEntity, EChangeAction } from '@brainassistant/contracts';

export interface IChangeProps {
  entity: EChangedEntity;
  action: EChangeAction;
  object?: ChangeableObjectDTO;
  modifiedAt?: string;
}

export class Change extends ValueObject<IChangeProps> {}
