import { IDbModels } from '../infra/database/mongodb/index.js';
import {
  ISlackOAuthAccessPresitant,
  SlackOAuthAccess,
} from '../domain/models/slack-oauth-access.js';
import { ISlackOAuthAccessDocument } from '../infra/database/mongodb/slack-oauth-access.model.js';
import { SlackOAuthAccessMapper } from '../mappers/slack-oauth-access.mapper.js';

export class SlackOAuthAccessRepo {
  private _models: IDbModels;

  constructor(models: IDbModels) {
    this._models = models;
  }

  public async create(
    slackOAuthAccess: SlackOAuthAccess
  ): Promise<ISlackOAuthAccessDocument> {
    const slackOAuthAccessData: ISlackOAuthAccessPresitant =
      SlackOAuthAccessMapper.toPersistence(slackOAuthAccess);

    const SlackOAuthAccessModel = this._models.SlackOAuthAccessModel;

    const slackOAuthAccessDocument: ISlackOAuthAccessDocument =
      await SlackOAuthAccessModel.create(slackOAuthAccessData);

    return slackOAuthAccessDocument;
  }

  public async deletedSlackOAuthAccessById(slackOAuthAccessId: string) {
    const slackOAuthAccessModel = this._models.SlackOAuthAccessModel;
    await slackOAuthAccessModel.deleteMany({
      _id: slackOAuthAccessId,
    });
  }

  public async getSlackOAuthAccessByUserId(
    userId: string
  ): Promise<SlackOAuthAccess | null> {
    const SlackOAuthAccessModel = this._models.SlackOAuthAccessModel;
    const slackOAuthAccessDocument: ISlackOAuthAccessDocument =
      await SlackOAuthAccessModel.findOne({ userId });

    const found = !!slackOAuthAccessDocument === true;
    if (!found) return null;

    const slackOAuthAccess: SlackOAuthAccess = SlackOAuthAccessMapper.toDomain(
      slackOAuthAccessDocument
    ) as SlackOAuthAccess;

    return slackOAuthAccess;
  }

  public async deletedSlackOAuthAccessByTeamId(teamId: string) {
    const slackOAuthAccessModel = this._models.SlackOAuthAccessModel;
    await slackOAuthAccessModel.deleteMany({
      teamId: teamId,
    });
  }
}
