/**
 * Wire values for ApiErrorDto.name. Cached PWAs may persist or switch on these
 * strings; renaming or removing a member is a breaking change. Add members only.
 *
 * TypeScript names follow the error layer, same `E` prefix as the rest of this package:
 * - `EApiError` — app-level catch-all (500)
 * - `E<UseCase>UseCaseError` — use-case HTTP names
 * - `E<Entity>Error` — domain codes that also go on the wire
 * - `E<Repo>ServiceError` — service/repo codes that also go on the wire
 *
 * Do not use an `ErrorCode` suffix. Wire strings stay as they are.
 */

/** App-level catch-all. Not a use-case or domain error. */
export enum EApiError {
  Unexpected = 'UNEXPECTED_ERROR',
}

export enum EUploadImageUseCaseError {
  NotSupportedType = 'UPLOAD_IMAGE_ERROR_CODE__NOT_SUPPORTED_TYPE',
  UploadToGoogleDriveFailed = 'UPLOAD_IMAGE_ERROR_CODE__UPLOAD_TO_GOOGLE_DRIVE_FAILED',
  GoogleRefreshTokenInvalid = 'UPLOAD_IMAGE_ERROR__GOOGLE_REFRESH_TOKEN_INVALID',
  FileTooLarge = 'FILE_TOO_LARGE',
}

export enum EGetImageUseCaseError {
  GoogleRefreshTokenInvalid = 'GET_IMAGE_ERROR__GOOGLE_REFRESH_TOKEN_INVALID',
  GoogleDriveRequestFailed = 'GET_IMAGE_ERROR__GOOGLE_DRIVE_REQUEST_FAILED',
}

export enum EGetChangesUseCaseError {
  ClientNotFound = 'GET_CHANGES_ERROR_CODE__CLIENT_NOT_FOUND',
}

export enum ELoginUseCaseError {
  LoginFailed = 'LOGIN_USECASE_ERROR__AUTHENTICATION_FAILED',
  UserAccountNotVerified = 'LOGIN_USECASE_ERROR__ACCOUNT_NOT_VERIFIED',
}

export enum ESignUpUseCaseError {
  EmailAlreadyInUse = 'SING_UP_ERROR_EMAIL_ALREADY_IN_USE',
  EmailInvalid = 'EMAIL_INVALID_ERROR_EMAIL_ALREADY_IN_USE',
}

export enum EGoogleAuthUseCaseError {
  EmailAlreadyInUse = 'GOOGLE_OAUTH_EMAIL_ALREADY_IN_USE',
  RefreshTokenNotReceived = 'GOOGLE_OAUTH_REFRESH_TOKEN_NOT_RECEIVED',
  AuthorizationFailed = 'GOOGLE_OAUTH_AUTHORIZATION_FAILED',
}

export enum ESpeechToTextUseCaseError {
  UnsupportedMimeType = 'SPEECH_TO_TEXT_ERROR__UNSUPPORTED_MIME_TYPE',
  TranscribeAudioFileFailed = 'SPEECH_TO_TEXT_ERROR__TRANSCRIBE_FAILED',
}

export enum EVerifyEmailUseCaseError {
  GivenTokenDoesNotExist = 'VERIFY_EMAIL_ERROR__GIVEN_TOKEN_DOES_NOT_EXIST',
  VerificationFailed = 'VERIFY_EMAIL_ERROR__VERIFICATION_FAILED',
}

export enum EReleaseClientIdUseCaseError {
  UserDoesNotExist = 'RELEASE_CLIENT_ID_USECASE_ERROR__USER_DOES_NOT_EXIST',
}

export enum ERemoveFromSlackUseCaseError {
  SlackOAuthAccessNotFound = 'REMOVE_FROM_SLACK_ERROR_CODE__SLACK_OAUTH_ACCESS_NOT_FOUND',
}

export enum ESlackEventReceivedUseCaseError {
  SlackEventTypeNotSupported = 'SLACK_EVENT_TYPE_NOT_SUPPORTED',
  SlackOAuthAccessNotFound = 'SLACK_OAUTH_ACCESS_NOT_FOUND',
}

/** Domain. Create/update task send these as JSON `name`. */
export enum ETaskError {
  TitleMissed = 'TASK_ERROR__TITLE_MISSED',
  TitleTooShort = 'TASK_ERROR__TITLE_TOO_SHORT',
  TitleTooLong = 'TASK_ERROR__TITLE_TOO_LONG',
}

export enum ETaskRepoServiceError {
  UserTaskNotFound = 'TASK_REPO_SERVICE_ERROR__USER_TASK_NOT_FOUND',
}

export enum EImageRepoServiceError {
  UserImageNotFound = 'IMAGE_REPO_SERVICE_ERROR__USER_IMAGE_NOT_FOUND',
}
