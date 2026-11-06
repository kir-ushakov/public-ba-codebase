/**
 * DTOs Index
 * Re-exports all Data Transfer Objects
 */

// Task DTOs
export type {
  TaskDTO,
  TaskDescriptionDoc,
  TaskDescriptionMark,
  TaskDescriptionNode,
  TaskDescriptionMarkType,
  TaskDescriptionNodeType,
  ChecklistItemDTO,
  AudioAttachment,
  AudioTranscription,
} from './task.dto';
export { TaskConst } from './task.const';
export { ImageConst } from './image.const';

// User DTOs
export type { UserDto } from './user.dto';

// Auth DTOs
export type {
  LoginRequestDTO,
  LoginResponseDTO,
  SignUpRequestDTO,
  SignUpResponseDTO,
  VerifyEmailResponseDTO,
} from './auth.dto';

// Tag DTOs
export type { TagDTO } from './tag.dto';
export { canonicalTagColor, TagConst } from './tag.const';

// Change/Sync DTOs
export type {
  IChangeableObjectDTO,
  ChangeableObjectDTO,
  DeletedObjectDTO,
  ChangeDTO,
} from './change.dto';

// API Response DTOs
export type {
  ApiErrorDto,
  ApiSuccessDto,
} from './api-response.dto';

