import { AggregateRoot } from '../AggregateRoot.js';
import { UniqueEntityID } from '../UniqueEntityID.js';
import { Result } from '../../core/result.js';
import { Guard } from '../../core/guard.js';
import { DomainError } from '../../core/domain-error.js';

export enum ETaskError {
  TitleMissed = 'TASK_ERROR__TITLE_MISSED',
  TitleTooShort = 'TASK_ERROR__TITLE_TOO_SHORT',
  TitleTooLong = 'TASK_ERROR__TITLE_TOO_LONG',
}

export interface ITaskProps {
  userId: string;
  type: string; // #TODO need to be special TYPE
  title: string;
  status: string; // #TODO need to be special TYPE
  imageId?: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface TaskPresitant extends ITaskProps {
  _id?: string;
}

export class Task extends AggregateRoot<ITaskProps> {
  static readonly TITLE_MIN_LENGTH = 5;
  static readonly TITLE_MAX_LENGTH = 120;

  get id(): UniqueEntityID {
    return this._id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get type(): string {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get status(): string {
    return this.props.status;
  }

  get imageId(): string {
    return this.props.imageId;
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

    const fullProps: ITaskProps = {
      ...props,
      createdAt: now,
      modifiedAt: now,
    };

    const validationResult = Task.isValid(fullProps);
    if (!validationResult) return validationResult as Result<never, DomainError<Task, ETaskError>>;

    const task = new Task(fullProps, id);

    return Result.ok<Task, never>(task);
  }

  public update(
    props: Partial<Omit<ITaskProps, 'createdAt' | 'modifiedAt'>>,
  ): Result<Task | never, DomainError<Task, ETaskError>> {
    const newProps: ITaskProps = {
      ...this.props,
      ...props,
      modifiedAt: new Date(),
    };

    const validationResult = Task.isValid(newProps);
    if (!validationResult) return validationResult as Result<never, DomainError<Task, ETaskError>>;

    this.props.type = newProps.type;
    this.props.title = newProps.title;
    this.props.status = newProps.status;
    this.props.modifiedAt = newProps.modifiedAt;
    this.props.imageId = newProps.imageId;
    return Result.ok<Task, never>();
  }

  private constructor(props: ITaskProps, id?: UniqueEntityID) {
    super(props, id);
  }

  private static isValid(props: ITaskProps): true | Result<never, DomainError<Task, ETaskError>> {
    if (!Guard.notEmptyString(props.title)) {
      return Result.fail<never, DomainError<Task, ETaskError>>(
        new DomainError<Task, ETaskError>(ETaskError.TitleMissed, 'Title for task missed'),
      );
    }

    if (!Guard.textLengthAtLeast(props.title, Task.TITLE_MIN_LENGTH)) {
      return Result.fail<never, DomainError<Task, ETaskError>>(
        new DomainError<Task, ETaskError>(
          ETaskError.TitleMissed,
          `Title "${props.title}" too short. It has to be not less thant ${Task.TITLE_MIN_LENGTH}`,
        ),
      );
    }

    if (!Guard.textLengthAtMost(props.title, Task.TITLE_MAX_LENGTH)) {
      return Result.fail<never, DomainError<Task, ETaskError>>(
        new DomainError<Task, ETaskError>(
          ETaskError.TitleTooShort,
          `Title "${props.title}" too long. It has to be not longer than ${Task.TITLE_MAX_LENGTH}`,
        ),
      );
    }

    return true;
  }
}
