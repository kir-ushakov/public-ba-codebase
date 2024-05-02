import { ChangeDTO } from '../../modules/sync/domain/dtos/change.dto';
import { Change } from '../../modules/sync/domain/values/change';

export class ChangeMapper {
  public static toDTO(change: Change): ChangeDTO {
    return {
      entity: change.props.entity,
      action: change.props.action,
      object: change.props.object,
    } as ChangeDTO;
  }
}
