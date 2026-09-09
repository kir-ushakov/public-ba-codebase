/**
 * @brainassistant/contracts
 * 
 * Shared API contracts and DTOs for BrainAssistant
 * Ensures type safety between frontend and backend
 */

// DTOs
export type {
  TaskDTO,
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

// Enums
export {
  EChangedEntity,
  EChangeAction,
  ETaskStatus,
  ETaskType,
  EApiError,
  EUploadImageUseCaseError,
  EGetImageUseCaseError,
  EGetChangesUseCaseError,
  ELoginUseCaseError,
  ESignUpUseCaseError,
  EGoogleAuthUseCaseError,
  ESpeechToTextUseCaseError,
  EVerifyEmailUseCaseError,
  EReleaseClientIdUseCaseError,
  ERemoveFromSlackUseCaseError,
  ESlackEventReceivedUseCaseError,
  ETaskError,
  ETaskRepoServiceError,
  EImageRepoServiceError,
} from './enums';

// Contracts
export { UploadImageContract, SendChangeContract, GetChangesContract } from './contracts';

