import { Action } from '../domain/models/actions.js';
import { IDbModels } from '../infra/database/mongodb/index.js';
import { ActionDocument, IActionPersistent } from '../infra/database/mongodb/action.model.js';
import { ActionMapper } from '../mappers/action.mapper.js';
import { SyncRevisionService } from './sync-revision.service.js';

export type RevisionedAction = {
  syncRevision: number;
  action: Action;
};

export class ActionRepo {
  private _models: IDbModels;
  private readonly revisions: SyncRevisionService;

  constructor(models: IDbModels) {
    this._models = models;
    this.revisions = new SyncRevisionService(models);
  }

  public async create(action: Action): Promise<ActionDocument> {
    const actionData: IActionPersistent = ActionMapper.toPersistence(action);

    const ActionModel = this._models.ActionModel;

    const newAction = await ActionModel.create(actionData);
    await this.revisions.stampAction(action.userId, String(newAction._id));

    return newAction;
  }

  public async getSinceRevision(userId: string, revision: number): Promise<RevisionedAction[]> {
    const actionDocuments: ActionDocument[] = await this._models.ActionModel.find({
      userId,
      syncRevision: { $gt: revision },
    }).sort({ syncRevision: 1 });

    return actionDocuments.flatMap(document => {
      const syncRevision = document.syncRevision;
      if (typeof syncRevision !== 'number') {
        return [];
      }
      return [{ syncRevision, action: ActionMapper.toDomain(document) }];
    });
  }
}
