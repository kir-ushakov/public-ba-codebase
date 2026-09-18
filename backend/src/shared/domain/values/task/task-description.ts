import {
  TaskConst,
  type TaskDescriptionDoc,
  type TaskDescriptionNode,
  type TaskDescriptionMarkType,
  type TaskDescriptionNodeType,
} from '@brainassistant/contracts';
import { Result } from '../../../core/result.js';
import { DomainError } from '../../../core/domain-error.js';
import { ValueObject } from '../../ValueObject.js';

export enum ETaskDescriptionError {
  Invalid = 'TASK_DESCRIPTION_ERROR__INVALID',
  TooLong = 'TASK_DESCRIPTION_ERROR__TOO_LONG',
}

const ALLOWED_NODE_TYPES = new Set<TaskDescriptionNodeType>([
  'doc',
  'paragraph',
  'text',
  'bulletList',
  'orderedList',
  'listItem',
  'hardBreak',
]);

const ALLOWED_MARK_TYPES = new Set<TaskDescriptionMarkType>(['bold', 'italic', 'strike', 'link']);

const LINK_HREF_PATTERN = /^(https?:\/\/|mailto:)/i;

type TaskDescriptionProps = {
  doc: TaskDescriptionDoc;
};

export class TaskDescription extends ValueObject<TaskDescriptionProps> {
  get doc(): TaskDescriptionDoc {
    return this.props.doc;
  }

  private constructor(props: TaskDescriptionProps) {
    super(props);
  }

  public toJSON(): TaskDescriptionDoc {
    return this.props.doc;
  }

  public isEmpty(): boolean {
    return collectText(this.props.doc).trim().length === 0;
  }

  public static create(
    raw: unknown,
  ): Result<TaskDescription, DomainError<TaskDescription, ETaskDescriptionError>> {
    if (!isPlainObject(raw) || raw.type !== 'doc') {
      return invalid('Description must be a document');
    }

    let serialized: string;
    try {
      serialized = JSON.stringify(raw);
    } catch {
      return invalid('Description is not valid JSON');
    }

    if (Buffer.byteLength(serialized, 'utf8') > TaskConst.DESCRIPTION_MAX_JSON_BYTES) {
      return tooLong(
        `Description is too large. It has to be not larger than ${TaskConst.DESCRIPTION_MAX_JSON_BYTES} bytes`,
      );
    }

    const walkResult = walkNode(raw, 0);
    if (walkResult.isFailure) {
      return Result.fail(walkResult.error);
    }

    if (walkResult.getValue() > TaskConst.DESCRIPTION_MAX_TEXT_LENGTH) {
      return tooLong(
        `Description is too long. It has to be not longer than ${TaskConst.DESCRIPTION_MAX_TEXT_LENGTH} characters`,
      );
    }

    return Result.ok(new TaskDescription({ doc: raw as TaskDescriptionDoc }));
  }
}

function walkNode(
  raw: unknown,
  depth: number,
): Result<number, DomainError<TaskDescription, ETaskDescriptionError>> {
  if (depth > TaskConst.DESCRIPTION_MAX_DEPTH) {
    return invalid('Description nesting is too deep');
  }

  if (!isPlainObject(raw) || typeof raw.type !== 'string' || !isNodeType(raw.type)) {
    return invalid('Description contains an unsupported node');
  }

  const marksResult = validateMarks(raw.marks);
  if (marksResult.isFailure) {
    return Result.fail(marksResult.error);
  }

  if (raw.type === 'text') {
    if (typeof raw.text !== 'string') {
      return invalid('Description text node is invalid');
    }
    if (raw.content !== undefined) {
      return invalid('Description text node cannot have child content');
    }
    return Result.ok(raw.text.length);
  }

  if (raw.text !== undefined) {
    return invalid('Description node has text on a non-text type');
  }

  if (raw.content === undefined) {
    return Result.ok(0);
  }

  if (!Array.isArray(raw.content)) {
    return invalid('Description node content is invalid');
  }

  let textLength = 0;
  for (const child of raw.content) {
    const childResult = walkNode(child, depth + 1);
    if (childResult.isFailure) {
      return childResult;
    }
    textLength += childResult.getValue();
  }

  return Result.ok(textLength);
}

function validateMarks(
  marks: unknown,
): Result<void, DomainError<TaskDescription, ETaskDescriptionError>> {
  if (marks === undefined) {
    return Result.ok(undefined);
  }

  if (!Array.isArray(marks)) {
    return invalid('Description marks are invalid');
  }

  for (const mark of marks) {
    if (!isPlainObject(mark) || typeof mark.type !== 'string' || !isMarkType(mark.type)) {
      return invalid('Description contains an unsupported mark');
    }

    if (mark.type === 'link') {
      const href = isPlainObject(mark.attrs) ? mark.attrs.href : undefined;
      if (typeof href !== 'string' || !LINK_HREF_PATTERN.test(href.trim())) {
        return invalid('Description link is invalid');
      }
    }
  }

  return Result.ok(undefined);
}

function collectText(node: TaskDescriptionDoc | TaskDescriptionNode): string {
  if ('text' in node && typeof node.text === 'string') {
    return node.text;
  }

  return (node.content ?? []).map(child => collectText(child)).join('');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNodeType(value: string): value is TaskDescriptionNodeType {
  return ALLOWED_NODE_TYPES.has(value as TaskDescriptionNodeType);
}

function isMarkType(value: string): value is TaskDescriptionMarkType {
  return ALLOWED_MARK_TYPES.has(value as TaskDescriptionMarkType);
}

function invalid(
  message: string,
): Result<never, DomainError<TaskDescription, ETaskDescriptionError>> {
  return Result.fail(
    new DomainError<TaskDescription, ETaskDescriptionError>(ETaskDescriptionError.Invalid, message),
  );
}

function tooLong(
  message: string,
): Result<never, DomainError<TaskDescription, ETaskDescriptionError>> {
  return Result.fail(
    new DomainError<TaskDescription, ETaskDescriptionError>(ETaskDescriptionError.TooLong, message),
  );
}
