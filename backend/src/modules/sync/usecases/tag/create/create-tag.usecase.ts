import { UseCase } from '../../../../../shared/core/UseCase.js';
import { Result } from '../../../../../shared/core/result.js';
import { UseCaseError } from '../../../../../shared/core/use-case-error.js';
import { DomainError } from '../../../../../shared/core/domain-error.js';
import { ETagError, Tag, TagProps } from '../../../../../shared/domain/models/tag.js';
import { UniqueEntityID } from '../../../../../shared/domain/UniqueEntityID.js';
import { TagRepoService } from '../../../../../shared/repo/tag-repo.service.js';
import { CreateTagErrors } from './create-tag.errors.js';

export type CreateTagResult = Result<Tag, UseCaseError<ETagError>>;

export type CreateTagParams = {
  tagProps: Omit<TagProps, 'createdAt' | 'modifiedAt'>;
  id?: UniqueEntityID;
};

export class CreateTag implements UseCase<CreateTagParams, Promise<CreateTagResult>> {
  constructor(private readonly tagRepoService: TagRepoService) {}

  public async execute(params: CreateTagParams): Promise<CreateTagResult> {
    const tagOrError: Result<Tag | never, DomainError<Tag, ETagError>> = Tag.create(
      params.tagProps,
      params.id,
    );
    if (tagOrError.isFailure) {
      return CreateTagErrors.DataInvalid(tagOrError.error);
    }

    const tag: Tag = tagOrError.getValue();
    await this.tagRepoService.create(tag);

    return Result.ok(tag);
  }
}
