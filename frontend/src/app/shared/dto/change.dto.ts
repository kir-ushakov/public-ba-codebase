import { EChangeAction, EChangedEntity } from '../models';

export interface ChangeableObjectDTO {
  id: string;
  modifiedAt: string;
}
export interface ChangeDTO {
  entity: EChangedEntity;
  action: EChangeAction;
  object: ChangeableObjectDTO;
}
