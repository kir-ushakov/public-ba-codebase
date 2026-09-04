/**
 * Serializable description of the public HTTP types.
 *
 * Cached PWA clients are compiled against a previous version of this package.
 * Removing a DTO field, renaming an enum member, or dropping a wire value is a
 * breaking change: `tsc` fails here first, then `npm test` fails against
 * `test/public-api.shape.json` until the snapshot is updated on purpose.
 */

import type {
  ApiErrorDto,
  ApiSuccessDto,
  ChangeDTO,
  DeletedObjectDTO,
  IChangeableObjectDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  SignUpRequestDTO,
  SignUpResponseDTO,
  TagDTO,
  TaskDTO,
  UserDto,
  VerifyEmailResponseDTO,
} from './dto';
import { GetChangesContract, SendChangeContract, UploadImageContract } from './contracts';
import { EChangeAction, EChangedEntity, ETaskStatus, ETaskType } from './enums';

type ExactKeys<T, K extends readonly (keyof T)[]> = Exclude<keyof T, K[number]> extends never
  ? Exclude<K[number], keyof T> extends never
    ? true
    : never
  : never;

const TASK_DTO_KEYS = [
  'id',
  'userId',
  'type',
  'title',
  'status',
  'imageId',
  'createdAt',
  'modifiedAt',
] as const satisfies readonly (keyof TaskDTO)[];
const _taskDto: ExactKeys<TaskDTO, typeof TASK_DTO_KEYS> = true;

const USER_DTO_KEYS = ['firstName', 'lastName', 'email', 'userId'] as const satisfies readonly (keyof UserDto)[];
const _userDto: ExactKeys<UserDto, typeof USER_DTO_KEYS> = true;

const TAG_DTO_KEYS = [
  'id',
  'userId',
  'isCategory',
  'name',
  'color',
  'createdAt',
  'modifiedAt',
] as const satisfies readonly (keyof TagDTO)[];
const _tagDto: ExactKeys<TagDTO, typeof TAG_DTO_KEYS> = true;

const CHANGEABLE_OBJECT_KEYS = ['id', 'modifiedAt'] as const satisfies readonly (keyof IChangeableObjectDTO)[];
const _changeable: ExactKeys<IChangeableObjectDTO, typeof CHANGEABLE_OBJECT_KEYS> = true;
const _deleted: ExactKeys<DeletedObjectDTO, typeof CHANGEABLE_OBJECT_KEYS> = true;

const CHANGE_DTO_KEYS = ['entity', 'action', 'object'] as const satisfies readonly (keyof ChangeDTO)[];
const _changeDto: ExactKeys<ChangeDTO, typeof CHANGE_DTO_KEYS> = true;

const LOGIN_REQUEST_KEYS = ['username', 'password'] as const satisfies readonly (keyof LoginRequestDTO)[];
const _loginReq: ExactKeys<LoginRequestDTO, typeof LOGIN_REQUEST_KEYS> = true;

const LOGIN_RESPONSE_KEYS = ['user', 'expireAt'] as const satisfies readonly (keyof LoginResponseDTO)[];
const _loginRes: ExactKeys<LoginResponseDTO, typeof LOGIN_RESPONSE_KEYS> = true;

const SIGNUP_REQUEST_KEYS = [
  'email',
  'firstName',
  'lastName',
  'password',
] as const satisfies readonly (keyof SignUpRequestDTO)[];
const _signupReq: ExactKeys<SignUpRequestDTO, typeof SIGNUP_REQUEST_KEYS> = true;

const SIGNUP_RESPONSE_KEYS = ['email', 'firstName', 'lastName'] as const satisfies readonly (keyof SignUpResponseDTO)[];
const _signupRes: ExactKeys<SignUpResponseDTO, typeof SIGNUP_RESPONSE_KEYS> = true;

const VERIFY_EMAIL_KEYS = ['email', 'verified'] as const satisfies readonly (keyof VerifyEmailResponseDTO)[];
const _verify: ExactKeys<VerifyEmailResponseDTO, typeof VERIFY_EMAIL_KEYS> = true;

const API_ERROR_KEYS = ['name', 'message'] as const satisfies readonly (keyof ApiErrorDto)[];
const _apiError: ExactKeys<ApiErrorDto, typeof API_ERROR_KEYS> = true;

const API_SUCCESS_KEYS = ['data'] as const satisfies readonly (keyof ApiSuccessDto)[];
const _apiSuccess: ExactKeys<ApiSuccessDto, typeof API_SUCCESS_KEYS> = true;

const UPLOAD_REQUEST_KEYS = ['imageId', 'file'] as const satisfies readonly (keyof UploadImageContract.Request)[];
const _uploadReq: ExactKeys<UploadImageContract.Request, typeof UPLOAD_REQUEST_KEYS> = true;

const UPLOAD_RESPONSE_KEYS = ['imageId'] as const satisfies readonly (keyof UploadImageContract.Response)[];
const _uploadRes: ExactKeys<UploadImageContract.Response, typeof UPLOAD_RESPONSE_KEYS> = true;

const GET_CHANGES_REQUEST_KEYS = ['clientId'] as const satisfies readonly (keyof GetChangesContract.Request)[];
const _getChangesReq: ExactKeys<GetChangesContract.Request, typeof GET_CHANGES_REQUEST_KEYS> = true;

const GET_CHANGES_RESPONSE_KEYS = ['changes'] as const satisfies readonly (keyof GetChangesContract.Response)[];
const _getChangesRes: ExactKeys<GetChangesContract.Response, typeof GET_CHANGES_RESPONSE_KEYS> = true;

const SEND_CHANGE_REQUEST_KEYS = [
  'changeableObjectDto',
] as const satisfies readonly (keyof SendChangeContract.Request)[];
const _sendChangeReq: ExactKeys<SendChangeContract.Request, typeof SEND_CHANGE_REQUEST_KEYS> = true;

void _taskDto;
void _userDto;
void _tagDto;
void _changeable;
void _deleted;
void _changeDto;
void _loginReq;
void _loginRes;
void _signupReq;
void _signupRes;
void _verify;
void _apiError;
void _apiSuccess;
void _uploadReq;
void _uploadRes;
void _getChangesReq;
void _getChangesRes;
void _sendChangeReq;

export const PUBLIC_API_SHAPE = {
  enums: {
    ETaskType: Object.values(ETaskType),
    ETaskStatus: Object.values(ETaskStatus),
    EChangedEntity: Object.values(EChangedEntity),
    EChangeAction: Object.values(EChangeAction),
  },
  dto: {
    TaskDTO: {
      keys: [...TASK_DTO_KEYS],
      optional: ['imageId'],
    },
    UserDto: { keys: [...USER_DTO_KEYS], optional: [] as string[] },
    TagDTO: { keys: [...TAG_DTO_KEYS], optional: [] as string[] },
    IChangeableObjectDTO: { keys: [...CHANGEABLE_OBJECT_KEYS], optional: [] as string[] },
    ChangeDTO: { keys: [...CHANGE_DTO_KEYS], optional: [] as string[] },
    LoginRequestDTO: { keys: [...LOGIN_REQUEST_KEYS], optional: [] as string[] },
    LoginResponseDTO: { keys: [...LOGIN_RESPONSE_KEYS], optional: ['expireAt'] },
    SignUpRequestDTO: { keys: [...SIGNUP_REQUEST_KEYS], optional: [] as string[] },
    SignUpResponseDTO: { keys: [...SIGNUP_RESPONSE_KEYS], optional: [] as string[] },
    VerifyEmailResponseDTO: { keys: [...VERIFY_EMAIL_KEYS], optional: [] as string[] },
    ApiErrorDto: { keys: [...API_ERROR_KEYS], optional: [] as string[] },
    ApiSuccessDto: { keys: [...API_SUCCESS_KEYS], optional: [] as string[] },
  },
  contracts: {
    UploadImageContract: {
      request: [...UPLOAD_REQUEST_KEYS],
      response: [...UPLOAD_RESPONSE_KEYS],
    },
    GetChangesContract: {
      request: [...GET_CHANGES_REQUEST_KEYS],
      response: [...GET_CHANGES_RESPONSE_KEYS],
    },
    SendChangeContract: {
      request: [...SEND_CHANGE_REQUEST_KEYS],
      response: 'entity-or-void',
    },
  },
};
