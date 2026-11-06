import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { DomainError } from '../../../../../shared/core/domain-error.js';
import { ETagError, Tag, TagProps } from '../../../../../shared/domain/models/tag.js';
import { UniqueEntityID } from '../../../../../shared/domain/UniqueEntityID.js';
import { TagRepoService } from '../../../../../shared/repo/tag-repo.service.js';
import { UpdateTagErrorCode, UpdateTagErrors } from './update-tag.errors.js';

export type UpdateTagResult = Result<Tag, UseCaseError<UpdateTagErrorCode>>;

export type UpdateTagParams = {
  userId: string;
  id: UniqueEntityID;
  tagProps: Omit<TagProps, 'createdAt' | 'modifiedAt'> & {
    createdAt?: Date;
    modifiedAt?: Date;
  };
};

export class UpdateTag implements UseCase<UpdateTagParams, Promise<UpdateTagResult>> {
  constructor(private readonly tagRepoService: TagRepoService) {}

  public async execute(params: UpdateTagParams): Promise<UpdateTagResult> {
    const existing = await this.tagRepoService.getUserTagById(params.userId, params.id.toString());
    if (existing.isFailure) {
      return UpdateTagErrors.TagNotFoundError(existing.error);
    }

    const tagOrError: Result<Tag | never, DomainError<Tag, ETagError>> = Tag.create(
      params.tagProps,
      params.id,
    );
    if (tagOrError.isFailure) {
      return UpdateTagErrors.DataInvalid(tagOrError.error);
    }

    const tag = tagOrError.getValue();
    await this.tagRepoService.save(tag);
    return Result.ok(tag);
  }
}
