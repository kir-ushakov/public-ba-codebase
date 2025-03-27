import { Action } from '../domain/models/actions.js';
import { IActionPersistent } from '../infra/database/mongodb/action.model.js';

export class ActionMapper {
  public static toDomain(raw: IActionPersistent): Action {
    const action = Action.create({
      userId: raw.userId,
      type: raw.type,
      occurredAt: raw.occurredAt,
      entityId: raw.entityId,
    });

    return action;
  }

  public static toPersistence(action: Action): IActionPersistent {
    return {
      userId: action.userId,
      type: action.type,
      occurredAt: action.occurredAt,
      entityId: action.entityId,
    };
  }
}
