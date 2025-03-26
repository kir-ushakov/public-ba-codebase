import { AggregateRoot } from '../AggregateRoot.js';
import { UniqueEntityID } from '../UniqueEntityID.js';
import { Result } from '../../core/Result.js';
import { Guard } from '../../core/guard.js';
import { TaskError } from './task.errors.js';
import { DomainError } from '../../core/domain-error.js';

export interface ITaskProps {
  userId: string;
  type: string; // #TODO need to be special TYPE
  title: string;
  status: string; // #TODO need to be special TYPE
  createdAt: Date;
  modifiedAt: Date;
}

export interface TaskPresitant extends ITaskProps {
  _id?: string;
}

export type CreateTaskResult =
  | Result<Task>
  | TaskError.TitleMissedError
  | TaskError.TitleTooLongError
  | TaskError.TitleTooShortError;

export type UpdateTaskResult =
  | Result<Task>
  | TaskError.TitleMissedError
  | TaskError.TitleTooLongError
  | TaskError.TitleTooShortError;

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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get modifiedAt(): Date {
    return this.props.modifiedAt;
  }

  public static create(
    props: ITaskProps,
    id?: UniqueEntityID
  ): CreateTaskResult {
    const validationResult = Task.isValid(props);
    if (!validationResult) return validationResult as Result<DomainError>;

    const task = new Task(props, id);

    return Result.ok<Task>(task);
  }

  public update(props: ITaskProps): UpdateTaskResult {
    const validationResult = Task.isValid(props);
    if (!validationResult) return validationResult as Result<DomainError>;
    this.props.type = props.type;
    this.props.title = props.title;
    this.props.status = props.status;
    this.props.modifiedAt = props.modifiedAt;
    return Result.ok<Task>();
  }

  private constructor(props: ITaskProps, id?: UniqueEntityID) {
    super(props, id);
  }

  private static isValid(props: ITaskProps): true | Result<DomainError> {
    if (!Guard.notEmptyString(props.title)) {
      return new TaskError.TitleMissedError();
    }

    if (!Guard.textLengthAtLeast(props.title, Task.TITLE_MIN_LENGTH)) {
      return new TaskError.TitleTooShortError(
        props.title,
        Task.TITLE_MIN_LENGTH
      );
    }

    if (!Guard.textLengthAtMost(props.title, Task.TITLE_MAX_LENGTH)) {
      return new TaskError.TitleTooLongError(
        props.title,
        Task.TITLE_MAX_LENGTH
      );
    }

    return true;
  }
}
