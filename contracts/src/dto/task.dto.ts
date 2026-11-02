import { ETaskCondition } from '../enums/task-condition.enum';
import { ETaskStatus } from '../enums/task-status.enum';
import { ETaskType } from '../enums/task-type.enum';

export type TaskDescriptionMarkType = 'bold' | 'italic' | 'strike' | 'link';

export type TaskDescriptionNodeType =
  | 'doc'
  | 'paragraph'
  | 'text'
  | 'bulletList'
  | 'orderedList'
  | 'listItem'
  | 'hardBreak';

export type TaskDescriptionMark = {
  type: TaskDescriptionMarkType;
  attrs?: {
    href?: string;
    target?: string;
  };
};

export type TaskDescriptionNode = {
  type: TaskDescriptionNodeType;
  attrs?: Record<string, unknown>;
  content?: TaskDescriptionNode[];
  marks?: TaskDescriptionMark[];
  text?: string;
};

export type TaskDescriptionDoc = {
  type: 'doc';
  content?: TaskDescriptionNode[];
};

export type ChecklistItemDTO = {
  id: string;
  text: string;
  completed: boolean;
};

/**
 * Task Data Transfer Object
 * Shared contract between frontend and backend for task data
 */
export type TaskDTO = {
  id: string;
  userId: string;
  type: ETaskType;
  title: string;
  status: ETaskStatus;
  /**
   * How the task can become active. Older clients omit this.
   * Absent on a note. A task stores at least one condition.
   */
  conditions?: ETaskCondition[];
  imageId?: string;
  images?: string[];
  description?: TaskDescriptionDoc;
  checklist?: ChecklistItemDTO[];
  tagIds?: string[];
  createdAt: string;
  modifiedAt: string;
};
