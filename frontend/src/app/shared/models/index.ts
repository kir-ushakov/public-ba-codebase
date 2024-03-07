/**
 * #NOTE
 * The model folder has to contain only interfaces of object
 * that important for application in general,
 * not only for specific component of service.
 * They should be a part of business logic of application.
 */
import { User } from './user.model';
import { Task, ETaskStatus, ETaskType } from './task.model';
import { Change, EChangeType, ChangeableObject } from './change.model';
import { Tag, ETagType } from './tag.model';

export {
  User,
  Task,
  ETaskStatus,
  ETaskType,
  Tag,
  ETagType,
  Change,
  EChangeType,
  ChangeableObject,
};
