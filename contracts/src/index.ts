/**
 * @brainassistant/contracts
 * 
 * Shared API contracts and DTOs for BrainAssistant
 * Ensures type safety between frontend and backend
 */

// DTOs
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
  UserDto,
  LoginRequestDTO,
  LoginResponseDTO,
  SignUpRequestDTO,
  SignUpResponseDTO,
  VerifyEmailResponseDTO,
  TagDTO,
  IChangeableObjectDTO,
  ChangeableObjectDTO,
  DeletedObjectDTO,
  ChangeDTO,
  ApiErrorDto,
  ApiSuccessDto,
} from './dto';
export { ImageConst, TaskConst, TagConst } from './dto';

// Enums
export {
  EChangedEntity,
  EChangeAction,
  ETaskStatus,
  ETaskType,
  ETaskCondition,
  EApiError,
  EUploadImageUseCaseError,
  EUploadAudioUseCaseError,
  EGetAudioUseCaseError,
  EDeleteAudioUseCaseError,
  EDeleteImageUseCaseError,
  EDeleteTaskUseCaseError,
  EGetImageUseCaseError,
  ELoginUseCaseError,
  ESignUpUseCaseError,
  EGoogleAuthUseCaseError,
  ESpeechToTextUseCaseError,
  EVerifyEmailUseCaseError,
  ERefreshSessionUseCaseError,
  ERemoveFromSlackUseCaseError,
  ESlackEventReceivedUseCaseError,
  ETaskError,
  ETagError,
  ETaskRepoServiceError,
  EImageRepoServiceError,
} from './enums';

// Contracts
export {
  UploadImageContract,
  UploadAudioContract,
  SendChangeContract,
  GetChangesContract,
  RefreshSessionContract,
} from './contracts';

