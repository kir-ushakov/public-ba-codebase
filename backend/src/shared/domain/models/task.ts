import {
  ETaskCondition,
  ETaskError,
  ETaskStatus,
  ETaskType,
  TaskConst,
  type ChecklistItemDTO,
  type TaskDescriptionDoc,
} from '@brainassistant/contracts';
import { deriveTaskConditions, parseTaskConditions, projectTaskType } from './task-conditions.js';
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
  conditions?: ETaskCondition[];
  imageId?: string;
  images?: string[];
  description?: TaskDescriptionDoc;
  checklist?: ChecklistItemDTO[];
  tagIds?: string[];
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
  conditions?: string[];
  imageId?: string;
  images?: string[];
  description?: TaskDescriptionDoc;
  checklist?: ChecklistItemDTO[];
  tagIds?: string[];
  createdAt: Date;
  modifiedAt: Date;
  syncRevision?: number;
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

  get conditions(): ETaskCondition[] | undefined {
    return this.props.conditions;
  }

  get imageId(): string | undefined {
    return this.props.imageId;
  }

  get images(): string[] | undefined {
    return this.props.images;
  }

  get description(): TaskDescriptionDoc | undefined {
    return this.props.description;
  }

  get checklist(): ChecklistItemDTO[] | undefined {
    return this.props.checklist;
  }

  get tagIds(): string[] {
    return this.props.tagIds ?? [];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get modifiedAt(): Date {
    return this.props.modifiedAt;
  }

  public static create(
    props: Omit<ITaskProps, 'createdAt' | 'modifiedAt'> & {
      createdAt?: Date;
      modifiedAt?: Date;
    },
    id?: UniqueEntityID,
  ): Result<Task | never, DomainError<Task, ETaskError>> {
    const now = new Date();

    const descriptionResult = Task.normalizeDescription(props.description);
    if (descriptionResult.isFailure) {
      return descriptionResult as Result<never, DomainError<Task, ETaskError>>;
    }
    const checklistResult = Task.normalizeChecklist(props.checklist);
    if (checklistResult.isFailure) {
      return checklistResult as Result<never, DomainError<Task, ETaskError>>;
    }
    const conditionsResult = Task.acceptConditions(
      props.status,
      props.type,
      props.conditions,
      'conditions' in props,
      undefined,
    );
    if (conditionsResult.isFailure) {
      return conditionsResult as Result<never, DomainError<Task, ETaskError>>;
    }

    const conditions = conditionsResult.getValue();
    const fullProps: ITaskProps = {
      ...props,
      description: descriptionResult.getValue(),
      checklist: checklistResult.getValue(),
      conditions,
      type: conditions ? projectTaskType(conditions) : props.type,
      tagIds: props.tagIds ?? [],
      createdAt: Task.instantOrNow(props.createdAt, now),
      modifiedAt: Task.instantOrNow(props.modifiedAt, now),
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
    props: Partial<Omit<ITaskProps, 'createdAt'>>,
  ): Result<Task | never, DomainError<Task, ETaskError>> {
    const descriptionResult =
      'description' in props
        ? Task.normalizeDescription(props.description)
        : Result.ok<TaskDescriptionDoc | undefined>(this.props.description);
    if (descriptionResult.isFailure) {
      return descriptionResult as Result<never, DomainError<Task, ETaskError>>;
    }
    const checklistResult =
      'checklist' in props
        ? Task.normalizeChecklist(props.checklist)
        : Result.ok<ChecklistItemDTO[] | undefined>(this.props.checklist);
    if (checklistResult.isFailure) {
      return checklistResult as Result<never, DomainError<Task, ETaskError>>;
    }

    const drafted: ITaskProps = {
      ...this.props,
      ...props,
      description: descriptionResult.getValue(),
      checklist: checklistResult.getValue(),
      createdAt: this.props.createdAt,
      modifiedAt: Task.instantOrNow(props.modifiedAt, new Date()),
    };
    const conditionsResult = Task.acceptConditions(
      drafted.status,
      drafted.type,
      props.conditions,
      'conditions' in props,
      this.props.conditions,
    );
    if (conditionsResult.isFailure) {
      return conditionsResult as Result<never, DomainError<Task, ETaskError>>;
    }
    const conditions = conditionsResult.getValue();
    const newProps: ITaskProps = {
      ...drafted,
      conditions,
      type: conditions ? projectTaskType(conditions) : drafted.type,
    };

    const validationResult = Task.isValid(newProps);
    if (validationResult.isFailure)
      return validationResult as Result<never, DomainError<Task, ETaskError>>;

    this.props.type = newProps.type;
    this.props.title = newProps.title;
    this.props.status = newProps.status;
    this.props.conditions = newProps.conditions;
    this.props.modifiedAt = newProps.modifiedAt;
    this.props.imageId = newProps.imageId;
    if ('images' in props) {
      this.props.images = newProps.images;
    }
    if ('tagIds' in props) {
      this.props.tagIds = newProps.tagIds ?? [];
    }
    if ('checklist' in props) {
      this.props.checklist = newProps.checklist;
    }
    this.props.description = newProps.description;
    return Result.ok<Task>();
  }

  private constructor(props: ITaskProps, id?: UniqueEntityID) {
    super(props, id);
  }

  private static instantOrNow(value: Date | undefined, now: Date): Date {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    return now;
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

  private static normalizeChecklist(
    raw: ChecklistItemDTO[] | undefined,
  ): Result<ChecklistItemDTO[] | undefined, DomainError<Task, ETaskError>> {
    if (raw === undefined || raw.length === 0) {
      return Result.ok<ChecklistItemDTO[] | undefined>();
    }

    if (raw.length > TaskConst.CHECKLIST_MAX_ITEMS) {
      return Task.checklistError(
        `A checklist can contain at most ${TaskConst.CHECKLIST_MAX_ITEMS} items`,
      );
    }

    const ids = new Set<string>();
    const items: ChecklistItemDTO[] = [];
    for (const item of raw) {
      if (!item || typeof item.id !== 'string' || typeof item.text !== 'string') {
        return Task.checklistError('A checklist item needs an id and text');
      }
      const id = item.id.trim();
      if (
        id.length === 0 ||
        id.length > TaskConst.CHECKLIST_ITEM_ID_MAX_LENGTH ||
        item.text.trim().length === 0 ||
        item.text.length > TaskConst.CHECKLIST_ITEM_MAX_LENGTH ||
        typeof item.completed !== 'boolean' ||
        ids.has(id)
      ) {
        return Task.checklistError('A checklist item is invalid');
      }
      ids.add(id);
      items.push({ id, text: item.text, completed: item.completed });
    }

    return Result.ok<ChecklistItemDTO[] | undefined>(items);
  }

  private static checklistError(message: string): Result<never, DomainError<Task, ETaskError>> {
    return Result.fail<never, DomainError<Task, ETaskError>>(
      new DomainError<Task, ETaskError>(ETaskError.ChecklistInvalid, message),
    );
  }

  private static isValid(props: ITaskProps): Result<void, DomainError<Task, ETaskError>> {
    // Check if we have imageId - if yes, title validation is relaxed
    const hasImage =
      Guard.notEmptyString(props.imageId) || (props.images?.some(id => id.length > 0) ?? false);

    if (!hasImage) {
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

    const checklistResult = Task.normalizeChecklist(props.checklist);
    if (checklistResult.isFailure) {
      return Result.fail<never, DomainError<Task, ETaskError>>(checklistResult.error);
    }

    if (props.status === ETaskStatus.Notes) {
      if (props.conditions && props.conditions.length > 0) {
        return Task.conditionsError('A note has no activation conditions');
      }
    } else if (!parseTaskConditions(props.conditions)) {
      return Task.conditionsError('Activation conditions are invalid');
    }

    return Result.ok<void, DomainError<Task, ETaskError>>();
  }

  private static acceptConditions(
    status: ETaskStatus,
    type: ETaskType,
    incoming: ETaskCondition[] | undefined,
    incomingProvided: boolean,
    existing: ETaskCondition[] | undefined,
  ): Result<ETaskCondition[] | undefined, DomainError<Task, ETaskError>> {
    if (status === ETaskStatus.Notes) {
      if (incomingProvided && incoming !== undefined && incoming.length > 0) {
        return Task.conditionsError('A note has no activation conditions');
      }
      return Result.ok<ETaskCondition[] | undefined>(undefined);
    }

    if (!incomingProvided) {
      if (existing && existing.length > 0) {
        return Result.ok<ETaskCondition[] | undefined>(existing);
      }
      return Result.ok<ETaskCondition[] | undefined>(deriveTaskConditions(type));
    }

    const parsed = parseTaskConditions(incoming);
    if (!parsed) {
      return Task.conditionsError('Activation conditions are invalid');
    }
    return Result.ok<ETaskCondition[] | undefined>(parsed);
  }

  private static conditionsError(message: string): Result<never, DomainError<Task, ETaskError>> {
    return Result.fail<never, DomainError<Task, ETaskError>>(
      new DomainError<Task, ETaskError>(ETaskError.ConditionsInvalid, message),
    );
  }
}
