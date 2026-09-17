import {
  ETaskError,
  ETaskStatus,
  ETaskType,
  TaskConst,
  type TaskDescriptionDoc,
} from '@brainassistant/contracts';
import { AggregateRoot } from '../AggregateRoot.js';
import { UniqueEntityID } from '../UniqueEntityID.js';
import { Result } from '../../core/result.js';
import { Guard } from '../../core/guard.js';
import { DomainError } from '../../core/domain-error.js';
import { ETaskDescriptionError, TaskDescription } from '../values/task/task-description.js';

export { ETaskError };

export interface ITaskProps {
  userId: string;
  type: ETaskType;
  title: string;
  status: ETaskStatus;
  imageId?: string;
  description?: TaskDescriptionDoc;
  createdAt: Date;
  modifiedAt: Date;
}

/** Mongo document shape: type/status are stored as strings (ETaskType / ETaskStatus wire values). */
export interface TaskPresitant {
  _id?: string;
  userId: string;
  type: string;
  title: string;
  status: string;
  imageId?: string;
  description?: TaskDescriptionDoc;
  createdAt: Date;
  modifiedAt: Date;
}

export class Task extends AggregateRoot<ITaskProps> {
  static readonly TITLE_MIN_LENGTH = TaskConst.TITLE_MIN_LENGTH;
  static readonly TITLE_MAX_LENGTH = TaskConst.TITLE_MAX_LENGTH;

  get id(): UniqueEntityID {
    return this._id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get type(): ETaskType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get status(): ETaskStatus {
    return this.props.status;
  }

  get imageId(): string | undefined {
    return this.props.imageId;
  }

  get description(): TaskDescriptionDoc | undefined {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get modifiedAt(): Date {
    return this.props.modifiedAt;
  }

  public static create(
    props: Omit<ITaskProps, 'createdAt' | 'modifiedAt'>,
    id?: UniqueEntityID,
  ): Result<Task | never, DomainError<Task, ETaskError>> {
    const now = new Date();

    const descriptionResult = Task.normalizeDescription(props.description);
    if (descriptionResult.isFailure) {
      return descriptionResult as Result<never, DomainError<Task, ETaskError>>;
    }

    const fullProps: ITaskProps = {
      ...props,
      description: descriptionResult.getValue(),
      createdAt: now,
      modifiedAt: now,
    };

    const validationResult = Task.isValid(fullProps);
    if (validationResult.isFailure)
      return validationResult as Result<never, DomainError<Task, ETaskError>>;

    const task = new Task(fullProps, id);

    return Result.ok<Task>(task);
  }

  /** Load a persisted task as-is. Write-time rules stay on create/update; production documents may predate them. */
  public static reconstitute(props: ITaskProps, id: UniqueEntityID): Task {
    return new Task(props, id);
  }

  public checkWriteInvariants(): Result<void, DomainError<Task, ETaskError>> {
    return Task.isValid(this.props);
  }

  public update(
    props: Partial<Omit<ITaskProps, 'createdAt' | 'modifiedAt'>>,
  ): Result<Task | never, DomainError<Task, ETaskError>> {
    const descriptionResult =
      'description' in props
        ? Task.normalizeDescription(props.description)
        : Result.ok<TaskDescriptionDoc | undefined>(this.props.description);
    if (descriptionResult.isFailure) {
      return descriptionResult as Result<never, DomainError<Task, ETaskError>>;
    }

    const newProps: ITaskProps = {
      ...this.props,
      ...props,
      description: descriptionResult.getValue(),
      modifiedAt: new Date(),
    };

    const validationResult = Task.isValid(newProps);
    if (validationResult.isFailure)
      return validationResult as Result<never, DomainError<Task, ETaskError>>;

    this.props.type = newProps.type;
    this.props.title = newProps.title;
    this.props.status = newProps.status;
    this.props.modifiedAt = newProps.modifiedAt;
    this.props.imageId = newProps.imageId;
    this.props.description = newProps.description;
    return Result.ok<Task>();
  }

  private constructor(props: ITaskProps, id?: UniqueEntityID) {
    super(props, id);
  }

  private static normalizeDescription(
    raw: TaskDescriptionDoc | undefined,
  ): Result<TaskDescriptionDoc | undefined, DomainError<Task, ETaskError>> {
    if (raw === undefined) {
      return Result.ok<TaskDescriptionDoc | undefined>(undefined);
    }

    const created = TaskDescription.create(raw);
    if (created.isFailure) {
      const code =
        created.error.code === ETaskDescriptionError.TooLong
          ? ETaskError.DescriptionTooLong
          : ETaskError.DescriptionInvalid;
      return Result.fail<never, DomainError<Task, ETaskError>>(
        new DomainError<Task, ETaskError>(code, created.error.message),
      );
    }

    const description = created.getValue();
    if (description.isEmpty()) {
      return Result.ok<TaskDescriptionDoc | undefined>(undefined);
    }

    return Result.ok<TaskDescriptionDoc | undefined>(description.toJSON());
  }

  private static isValid(props: ITaskProps): Result<void, DomainError<Task, ETaskError>> {
    // Check if we have imageId - if yes, title validation is relaxed
    const hasImageId = Guard.notEmptyString(props.imageId);

    if (!hasImageId) {
      // No imageId provided - title is required and must meet length requirements
      if (!Guard.notEmptyString(props.title)) {
        return Result.fail<never, DomainError<Task, ETaskError>>(
          new DomainError<Task, ETaskError>(
            ETaskError.TitleMissed,
            'Title is required when no image is provided',
          ),
        );
      }

      if (!Guard.textLengthAtLeast(props.title, Task.TITLE_MIN_LENGTH)) {
        return Result.fail<never, DomainError<Task, ETaskError>>(
          new DomainError<Task, ETaskError>(
            ETaskError.TitleTooShort,
            `Title "${props.title}" too short. It has to be not less than ${Task.TITLE_MIN_LENGTH}`,
          ),
        );
      }
    }

    // Always check max length if title is provided (regardless of imageId)
    if (props.title && !Guard.textLengthAtMost(props.title, Task.TITLE_MAX_LENGTH)) {
      return Result.fail<never, DomainError<Task, ETaskError>>(
        new DomainError<Task, ETaskError>(
          ETaskError.TitleTooLong,
          `Title "${props.title}" too long. It has to be not longer than ${Task.TITLE_MAX_LENGTH}`,
        ),
      );
    }

    if (props.description !== undefined) {
      const descriptionResult = TaskDescription.create(props.description);
      if (descriptionResult.isFailure) {
        const code =
          descriptionResult.error.code === ETaskDescriptionError.TooLong
            ? ETaskError.DescriptionTooLong
            : ETaskError.DescriptionInvalid;
        return Result.fail<never, DomainError<Task, ETaskError>>(
          new DomainError<Task, ETaskError>(code, descriptionResult.error.message),
        );
      }
    }

    return Result.ok<void, DomainError<Task, ETaskError>>();
  }
}
