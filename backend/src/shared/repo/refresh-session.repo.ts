import { IDbModels } from '../infra/database/mongodb/index.js';

export type RefreshSessionRecord = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export class RefreshSessionRepo {
  constructor(private readonly models: IDbModels) {}

  public async insert(record: RefreshSessionRecord): Promise<void> {
    await this.models.RefreshSessionModel.create(record);
  }

  /** Deletes the row and returns it. A second call with the same hash finds nothing. */
  public async consume(tokenHash: string): Promise<RefreshSessionRecord | null> {
    const doc = await this.models.RefreshSessionModel.findOneAndDelete({ tokenHash }).exec();
    if (!doc) {
      return null;
    }
    return {
      userId: doc.userId,
      tokenHash: doc.tokenHash,
      expiresAt: doc.expiresAt,
    };
  }
}
