import { Types } from 'mongoose';
import { IDbModels } from '../infra/database/mongodb/index.js';
import { RefreshSessionDocument } from '../infra/database/mongodb/refresh-session.model.js';

export type RefreshSessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  familyId: string;
  consumedAt: Date | null;
};

export type NewRefreshSession = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  familyId: string;
};

export class RefreshSessionRepo {
  constructor(private readonly models: IDbModels) {}

  public async insert(record: NewRefreshSession): Promise<string> {
    const doc = await this.models.RefreshSessionModel.create(record);
    return doc._id.toString();
  }

  /**
   * Claims a live refresh token. A second presentation inside `reuseGraceMs`
   * is a lost race and leaves the family in place. Outside that window it is
   * treated as theft and the family is deleted. Returns the claimed session,
   * or null when the token cannot start a new one.
   */
  public async present(
    tokenHash: string,
    now: Date,
    reuseGraceMs: number,
  ): Promise<RefreshSessionRecord | null> {
    const claimed = await this.claim(tokenHash, now);
    if (claimed) {
      return claimed;
    }

    const existing = await this.models.RefreshSessionModel.findOne({ tokenHash }).exec();
    if (!existing) {
      return null;
    }

    if (existing.expiresAt.getTime() <= now.getTime()) {
      await this.models.RefreshSessionModel.deleteOne({ _id: existing._id }).exec();
      return null;
    }

    const consumedAt = existing.consumedAt ?? null;
    if (consumedAt && now.getTime() - consumedAt.getTime() <= reuseGraceMs) {
      return null;
    }

    await this.revokeFamily(familyIdOf(existing), existing._id);
    return null;
  }

  /** Deletes every session in the same login as this refresh token. */
  public async revokePresented(tokenHash: string): Promise<void> {
    const doc = await this.models.RefreshSessionModel.findOne({ tokenHash }).exec();
    if (!doc) {
      return;
    }
    await this.revokeFamily(familyIdOf(doc), doc._id);
  }

  /** Keeps spent tokens recognizable for as long as the active session lives. */
  public async extendFamily(familyId: string, expiresAt: Date): Promise<void> {
    await this.models.RefreshSessionModel.updateMany({ familyId }, { $set: { expiresAt } }).exec();
  }

  private async claim(tokenHash: string, now: Date): Promise<RefreshSessionRecord | null> {
    const claimed = await this.models.RefreshSessionModel.findOneAndUpdate(
      { tokenHash, consumedAt: null, expiresAt: { $gt: now } },
      { $set: { consumedAt: now } },
      { new: false },
    ).exec();
    if (!claimed) {
      return null;
    }

    const familyId = familyIdOf(claimed);
    if (!claimed.familyId) {
      await this.models.RefreshSessionModel.updateOne(
        { _id: claimed._id },
        { $set: { familyId } },
      ).exec();
    }

    return {
      id: claimed._id.toString(),
      userId: claimed.userId,
      tokenHash: claimed.tokenHash,
      expiresAt: claimed.expiresAt,
      familyId,
      consumedAt: now,
    };
  }

  private async revokeFamily(familyId: string, alsoId: Types.ObjectId): Promise<void> {
    await this.models.RefreshSessionModel.deleteMany({
      $or: [{ familyId }, { _id: alsoId }],
    }).exec();
  }
}

function familyIdOf(
  doc: Pick<RefreshSessionDocument, 'familyId'> & { _id: Types.ObjectId },
): string {
  return doc.familyId ?? doc._id.toString();
}
