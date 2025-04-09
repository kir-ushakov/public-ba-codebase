import { Action } from '../domain/models/actions.js';
import { IDbModels } from '../infra/database/mongodb/index.js';
import {
  ActionDocument,
  EActionType,
  IActionPersistent,
} from '../infra/database/mongodb/action.model.js';
import { ActionMapper } from '../mappers/action.mapper.js';

export class ActionRepo {
  private _models: IDbModels;

  constructor(models: IDbModels) {
    this._models = models;
  }

  public async create(action: Action): Promise<ActionDocument> {
    const actionData: IActionPersistent = ActionMapper.toPersistence(action);

    const ActionModel = this._models.ActionModel;

    const newAction = await ActionModel.create(actionData);

    return newAction;
  }

  public async getActionsOccurredSince(
    userId: string,
    time: Date = null,
    actionType: EActionType = null
  ): Promise<Action[]> {
    const actionModel = this._models.ActionModel;
    let actionDocuments: ActionDocument[];

    const filter = { userId: userId };
    if (time) {
      filter['occurredAt'] = { $gte: time };
    }
    if (actionType) {
      filter['type'] = actionType;
    }

    actionDocuments = await actionModel.find(filter);
    return actionDocuments.map((a) => ActionMapper.toDomain(a));
  }
}
