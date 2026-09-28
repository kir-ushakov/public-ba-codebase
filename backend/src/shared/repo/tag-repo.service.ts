import { Tag, TagPersistent } from '../domain/models/tag.js';
import { IDbModels } from '../infra/database/mongodb/index.js';
import { isMongoDuplicateKeyError } from '../infra/database/mongodb/mongo-error.js';
import { TagMapper } from '../mappers/tag.mapper.js';
import { serviceFail } from '../core/service-fail.factory.js';
import { ServiceErrorLevel } from '../core/service-error-level.enum.js';
import { ETagRepoLoadError } from './tag-repo.service.error.js';

export { ETagRepoLoadError };

export class TagRepoService {
  constructor(private readonly models: IDbModels) {}

  public async create(tag: Tag): Promise<void> {
    const tagData: TagPersistent = TagMapper.toPersistence(tag);

    try {
      await this.models.TagModel.create(tagData);
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        await this.ownDocumentIfDuplicateKey(tag, error);
        return;
      }
      throw error;
    }
  }

  public async getChanges(userId: string, syncTime: Date): Promise<Tag[]> {
    const changedTags: TagPersistent[] = await this.models.TagModel.find({
      userId: userId,
      modifiedAt: { $gte: new Date(syncTime) },
    })
      .sort({ modifiedAt: 1 })
      .lean();

    return changedTags
      .map(raw => this.toDomainIfValid(raw))
      .filter((tag): tag is Tag => tag !== null);
  }

  public async deleteById(tagId: string): Promise<void> {
    await this.models.TagModel.deleteOne({
      _id: tagId,
    });
  }

  public async exists(tagId: string, userId?: string): Promise<boolean> {
    const params: { _id: string; userId?: string } = { _id: tagId };
    if (userId) {
      params.userId = userId;
    }
    const existingTag = await this.models.TagModel.findOne(params);
    return !!existingTag;
  }

  public async findOwnedIds(userId: string, tagIds: string[]): Promise<string[]> {
    if (tagIds.length === 0) {
      return [];
    }

    const docs = await this.models.TagModel.find({
      userId,
      _id: { $in: tagIds },
    })
      .select('_id')
      .lean();

    return docs.map(doc => String(doc._id));
  }

  private toDomainIfValid(raw: TagPersistent): Tag | null {
    const tag = TagMapper.toDomain(raw);
    const invariants = tag.checkWriteInvariants();
    if (invariants.isSuccess) {
      return tag;
    }

    void serviceFail<ETagRepoLoadError>(
      'Persisted tag failed write-time validation and was skipped',
      ETagRepoLoadError.PersistedTagInvalid,
      {
        level: ServiceErrorLevel.Low,
        metadata: {
          tagId: tag.id.toString(),
          userId: tag.userId,
          domainCode: invariants.error.code,
        },
      },
    );
    return null;
  }

  private async ownDocumentIfDuplicateKey(tag: Tag, error: unknown): Promise<void> {
    const existing = await this.models.TagModel.findOne({
      _id: tag.id.toString(),
      userId: tag.userId,
    });
    if (existing) {
      return;
    }

    throw error;
  }
}
