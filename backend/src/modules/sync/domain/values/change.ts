import { ValueObject } from '../../../../shared/domain/ValueObject.js';
import { ChangeableModelDTO } from '@brainassistant/contracts';
import { EChangedEntity, EChangeAction } from '@brainassistant/contracts';

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
