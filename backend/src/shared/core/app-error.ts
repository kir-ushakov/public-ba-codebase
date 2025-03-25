import { EAuthenticateUserError } from '../../modules/auth/usecases/google-auth/google-auth.errors.js';
import { ERemoveFromSlackErrors } from '../../modules/integrations/slack/usecases/remove-from-slack/remove-from-slack.errors.js';
import { EClientError } from '../domain/models/client.errors.js';
import { ETaskError } from '../domain/models/task.errors.js';

export enum EAppError {
  UnexpectedError = 'UNEXPECTED_ERROR',
  UserNotAuthenticated = 'USER_NOT_AUTHENTICATED',
}
export type AppError =
  | EAppError
  | ETaskError
  | EClientError
  | ERemoveFromSlackErrors
  | EAuthenticateUserError;
