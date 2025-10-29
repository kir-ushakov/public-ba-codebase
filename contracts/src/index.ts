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
  TagDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  SignUpRequestDTO,
  SignUpResponseDTO,
  VerifyEmailResponseDTO,
  IChangeableObjectDTO,
  ChangeableObjectDTO,
  DeletedObjectDTO,
  ChangeDTO,
  ApiErrorDto,
  ApiSuccessDto,
} from './dto';

// Enums
export { EChangedEntity, EChangeAction } from './enums';

// Contracts
export { UploadImageContract, SendChangeContract, GetChangesContract } from './contracts';

