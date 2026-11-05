/**
 * Serializable description of the public HTTP types.
 *
 * Cached PWA clients are compiled against a previous version of this package.
 * Removing a DTO field, renaming an enum member, or dropping a wire value is a
 * breaking change: `tsc` fails here first, then `npm test` fails against
 * `test/public-api.shape.json` until the snapshot is updated on purpose.
 */

import {
  ImageConst,
  TagConst,
  TaskConst,
  type ApiErrorDto,
  type ApiSuccessDto,
  type ChangeDTO,
  type DeletedObjectDTO,
  type IChangeableObjectDTO,
  type LoginRequestDTO,
  type LoginResponseDTO,
  type SignUpRequestDTO,
  type SignUpResponseDTO,
  type TagDTO,
  type AudioAttachment,
  type AudioTranscription,
  type ChecklistItemDTO,
  type TaskDescriptionDoc,
  type TaskDescriptionMark,
  type TaskDescriptionNode,
  type TaskDTO,
  type UserDto,
  type VerifyEmailResponseDTO,
} from './dto';
import {
  GetChangesContract,
  RefreshSessionContract,
  SendChangeContract,
  UploadAudioContract,
  UploadImageContract,
} from './contracts';
import {
  EApiError,
  EChangeAction,
  EChangedEntity,
  EDeleteAudioUseCaseError,
  EGetAudioUseCaseError,
  EGetImageUseCaseError,
  EGoogleAuthUseCaseError,
  EImageRepoServiceError,
  ELoginUseCaseError,
  ERefreshSessionUseCaseError,
  ERemoveFromSlackUseCaseError,
  ESignUpUseCaseError,
  ESlackEventReceivedUseCaseError,
  ESpeechToTextUseCaseError,
  ETagError,
  ETagRepoServiceError,
  ETaskCondition,
  ETaskError,
  ETaskRepoServiceError,
  ETaskStatus,
  ETaskType,
  EUploadAudioUseCaseError,
  EUploadImageUseCaseError,
  EVerifyEmailUseCaseError,
} from './enums';

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
  'conditions',
  'imageId',
  'images',
  'description',
  'checklist',
  'audioAttachments',
  'createdAt',
  'modifiedAt',
  'tagIds',
] as const satisfies readonly (keyof TaskDTO)[];
const _taskDto: ExactKeys<TaskDTO, typeof TASK_DTO_KEYS> = true;

const CHECKLIST_ITEM_DTO_KEYS = [
  'id',
  'text',
  'completed',
] as const satisfies readonly (keyof ChecklistItemDTO)[];
const _checklistItemDto: ExactKeys<ChecklistItemDTO, typeof CHECKLIST_ITEM_DTO_KEYS> = true;

const AUDIO_ATTACHMENT_KEYS = [
  'id',
  'durationMs',
  'mimeType',
  'createdAt',
  'transcription',
] as const satisfies readonly (keyof AudioAttachment)[];
const _audioAttachment: ExactKeys<AudioAttachment, typeof AUDIO_ATTACHMENT_KEYS> = true;

const AUDIO_TRANSCRIPTION_KEYS = [
  'text',
  'createdAt',
  'model',
] as const satisfies readonly (keyof AudioTranscription)[];
const _audioTranscription: ExactKeys<AudioTranscription, typeof AUDIO_TRANSCRIPTION_KEYS> = true;

const UPLOAD_AUDIO_REQUEST_KEYS = [
  'audioId',
  'file',
] as const satisfies readonly (keyof UploadAudioContract.Request)[];
const _uploadAudioReq: ExactKeys<UploadAudioContract.Request, typeof UPLOAD_AUDIO_REQUEST_KEYS> = true;

const UPLOAD_AUDIO_RESPONSE_KEYS = [
  'audioId',
] as const satisfies readonly (keyof UploadAudioContract.Response)[];
const _uploadAudioRes: ExactKeys<UploadAudioContract.Response, typeof UPLOAD_AUDIO_RESPONSE_KEYS> = true;

const TASK_DESCRIPTION_DOC_KEYS = ['type', 'content'] as const satisfies readonly (keyof TaskDescriptionDoc)[];
const _taskDescriptionDoc: ExactKeys<TaskDescriptionDoc, typeof TASK_DESCRIPTION_DOC_KEYS> = true;

const TASK_DESCRIPTION_NODE_KEYS = [
  'type',
  'attrs',
  'content',
  'marks',
  'text',
] as const satisfies readonly (keyof TaskDescriptionNode)[];
const _taskDescriptionNode: ExactKeys<TaskDescriptionNode, typeof TASK_DESCRIPTION_NODE_KEYS> = true;

const TASK_DESCRIPTION_MARK_KEYS = ['type', 'attrs'] as const satisfies readonly (keyof TaskDescriptionMark)[];
const _taskDescriptionMark: ExactKeys<TaskDescriptionMark, typeof TASK_DESCRIPTION_MARK_KEYS> = true;

const USER_DTO_KEYS = ['firstName', 'lastName', 'email', 'userId'] as const satisfies readonly (keyof UserDto)[];
const _userDto: ExactKeys<UserDto, typeof USER_DTO_KEYS> = true;

const TAG_DTO_KEYS = [
  'id',
  'userId',
  'name',
  'color',
  'createdAt',
  'modifiedAt',
  'isPinned',
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

const GET_CHANGES_REQUEST_KEYS = [
  'afterRevision',
] as const satisfies readonly (keyof GetChangesContract.Request)[];
const _getChangesReq: ExactKeys<GetChangesContract.Request, typeof GET_CHANGES_REQUEST_KEYS> = true;

const GET_CHANGES_RESPONSE_KEYS = [
  'changes',
  'syncRevision',
] as const satisfies readonly (keyof GetChangesContract.Response)[];
const _getChangesRes: ExactKeys<GetChangesContract.Response, typeof GET_CHANGES_RESPONSE_KEYS> = true;

const REFRESH_SESSION_RESPONSE_KEYS = [
  'refreshed',
] as const satisfies readonly (keyof RefreshSessionContract.Response)[];
const _refreshSessionRes: ExactKeys<
  RefreshSessionContract.Response,
  typeof REFRESH_SESSION_RESPONSE_KEYS
> = true;

const SEND_CHANGE_REQUEST_KEYS = [
  'changeableObjectDto',
] as const satisfies readonly (keyof SendChangeContract.Request)[];
const _sendChangeReq: ExactKeys<SendChangeContract.Request, typeof SEND_CHANGE_REQUEST_KEYS> = true;

void _taskDto;
type _ChecklistItemDtoShapeOk = typeof _checklistItemDto;
void _audioAttachment;
void _audioTranscription;
void _uploadAudioReq;
void _uploadAudioRes;
void _taskDescriptionDoc;
void _taskDescriptionNode;
void _taskDescriptionMark;
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
void _refreshSessionRes;
void _sendChangeReq;

export const PUBLIC_API_SHAPE = {
  enums: {
    ETaskType: Object.values(ETaskType),
    ETaskStatus: Object.values(ETaskStatus),
    ETaskCondition: Object.values(ETaskCondition),
    EChangedEntity: Object.values(EChangedEntity),
    EChangeAction: Object.values(EChangeAction),
    EApiError: Object.values(EApiError),
    EUploadImageUseCaseError: Object.values(EUploadImageUseCaseError),
    EUploadAudioUseCaseError: Object.values(EUploadAudioUseCaseError),
    EGetAudioUseCaseError: Object.values(EGetAudioUseCaseError),
    EDeleteAudioUseCaseError: Object.values(EDeleteAudioUseCaseError),
    EGetImageUseCaseError: Object.values(EGetImageUseCaseError),
    ELoginUseCaseError: Object.values(ELoginUseCaseError),
    ESignUpUseCaseError: Object.values(ESignUpUseCaseError),
    EGoogleAuthUseCaseError: Object.values(EGoogleAuthUseCaseError),
    ESpeechToTextUseCaseError: Object.values(ESpeechToTextUseCaseError),
    EVerifyEmailUseCaseError: Object.values(EVerifyEmailUseCaseError),
    ERefreshSessionUseCaseError: Object.values(ERefreshSessionUseCaseError),
    ERemoveFromSlackUseCaseError: Object.values(ERemoveFromSlackUseCaseError),
    ESlackEventReceivedUseCaseError: Object.values(ESlackEventReceivedUseCaseError),
    ETaskError: Object.values(ETaskError),
    ETagError: Object.values(ETagError),
    ETagRepoServiceError: Object.values(ETagRepoServiceError),
    ETaskRepoServiceError: Object.values(ETaskRepoServiceError),
    EImageRepoServiceError: Object.values(EImageRepoServiceError),
  },
  dto: {
    TaskDTO: {
      keys: [...TASK_DTO_KEYS],
      optional: ['imageId', 'images', 'description', 'checklist', 'audioAttachments', 'tagIds', 'conditions'],
    },
    AudioAttachment: {
      keys: [...AUDIO_ATTACHMENT_KEYS],
      optional: ['transcription'],
    },
    AudioTranscription: {
      keys: [...AUDIO_TRANSCRIPTION_KEYS],
      optional: ['model'],
    },
    ChecklistItemDTO: {
      keys: [...CHECKLIST_ITEM_DTO_KEYS],
      optional: [] as string[],
    },
    TaskDescriptionDoc: {
      keys: [...TASK_DESCRIPTION_DOC_KEYS],
      optional: ['content'],
    },
    TaskDescriptionNode: {
      keys: [...TASK_DESCRIPTION_NODE_KEYS],
      optional: ['attrs', 'content', 'marks', 'text'],
    },
    TaskDescriptionMark: {
      keys: [...TASK_DESCRIPTION_MARK_KEYS],
      optional: ['attrs'],
    },
    UserDto: { keys: [...USER_DTO_KEYS], optional: [] as string[] },
    TagDTO: { keys: [...TAG_DTO_KEYS], optional: ['isPinned'] },
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
    UploadAudioContract: {
      request: [...UPLOAD_AUDIO_REQUEST_KEYS],
      response: [...UPLOAD_AUDIO_RESPONSE_KEYS],
    },
    GetChangesContract: {
      request: [...GET_CHANGES_REQUEST_KEYS],
      response: [...GET_CHANGES_RESPONSE_KEYS],
    },
    RefreshSessionContract: {
      request: 'cookie',
      response: [...REFRESH_SESSION_RESPONSE_KEYS],
    },
    SendChangeContract: {
      request: [...SEND_CHANGE_REQUEST_KEYS],
      response: 'entity-or-void',
    },
  },
  consts: {
    ImageConst,
    TaskConst,
    TagConst,
  },
};
