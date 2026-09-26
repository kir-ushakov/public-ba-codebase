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
  imageId?: string;
  images?: string[];
  description?: TaskDescriptionDoc;
  createdAt: string;
  modifiedAt: string;
};
