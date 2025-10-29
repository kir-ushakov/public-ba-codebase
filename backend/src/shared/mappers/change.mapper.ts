import { ChangeDTO } from '@brainassistant/contracts';
import { Change } from '../../modules/sync/domain/values/change.js';

export class ChangeMapper {
  public static toDTO(change: Change): ChangeDTO {
    return {
      entity: change.props.entity,
      action: change.props.action,
      object: change.props.object,
    } as ChangeDTO;
  }
}
