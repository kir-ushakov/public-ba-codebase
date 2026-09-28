import { ETagError, TagConst } from '@brainassistant/contracts';
import { AggregateRoot } from '../AggregateRoot.js';
import { UniqueEntityID } from '../UniqueEntityID.js';
import { Result } from '../../core/result.js';
import { Guard } from '../../core/guard.js';
import { DomainError } from '../../core/domain-error.js';

export { ETagError };

export type TagProps = {
  userId: string;
  isCategory: boolean;
  name: string;
  color: string;
  createdAt: Date;
  modifiedAt: Date;
};

/** Mongo document shape. */
export type TagPersistent = {
  _id?: string;
  userId: string;
  isCategory: boolean;
  name: string;
  color: string;
  createdAt: Date;
  modifiedAt: Date;
};

export class Tag extends AggregateRoot<TagProps> {
  static readonly NAME_MIN_LENGTH = TagConst.NAME_MIN_LENGTH;
  static readonly NAME_MAX_LENGTH = TagConst.NAME_MAX_LENGTH;

  get id(): UniqueEntityID {
    return this._id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get isCategory(): boolean {
    return this.props.isCategory;
  }

  get name(): string {
    return this.props.name;
  }

  get color(): string {
    return this.props.color;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get modifiedAt(): Date {
    return this.props.modifiedAt;
  }

  public static create(
    props: Omit<TagProps, 'createdAt' | 'modifiedAt'>,
    id?: UniqueEntityID,
  ): Result<Tag | never, DomainError<Tag, ETagError>> {
    const now = new Date();
    const fullProps: TagProps = {
      ...props,
      createdAt: now,
      modifiedAt: now,
    };

    const validationResult = Tag.isValid(fullProps);
    if (validationResult.isFailure) {
      return validationResult as Result<never, DomainError<Tag, ETagError>>;
    }

    return Result.ok<Tag>(new Tag(fullProps, id));
  }

  /** Load a persisted tag as-is. Write-time rules stay on create. */
  public static reconstitute(props: TagProps, id: UniqueEntityID): Tag {
    return new Tag(props, id);
  }

  public checkWriteInvariants(): Result<void, DomainError<Tag, ETagError>> {
    return Tag.isValid(this.props);
  }

  private constructor(props: TagProps, id?: UniqueEntityID) {
    super(props, id);
  }

  private static isValid(props: TagProps): Result<void, DomainError<Tag, ETagError>> {
    if (
      !Guard.notEmptyString(props.name) ||
      !Guard.textLengthAtLeast(props.name, Tag.NAME_MIN_LENGTH)
    ) {
      return Result.fail<never, DomainError<Tag, ETagError>>(
        new DomainError<Tag, ETagError>(ETagError.NameMissed, 'Tag name is required'),
      );
    }

    if (!Guard.textLengthAtMost(props.name, Tag.NAME_MAX_LENGTH)) {
      return Result.fail<never, DomainError<Tag, ETagError>>(
        new DomainError<Tag, ETagError>(
          ETagError.NameTooLong,
          `Tag name "${props.name}" too long. It has to be not longer than ${Tag.NAME_MAX_LENGTH}`,
        ),
      );
    }

    if (!Guard.notEmptyString(props.color)) {
      return Result.fail<never, DomainError<Tag, ETagError>>(
        new DomainError<Tag, ETagError>(ETagError.ColorMissed, 'Tag color is required'),
      );
    }

    return Result.ok<void, DomainError<Tag, ETagError>>();
  }
}
