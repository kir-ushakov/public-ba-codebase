import { EAuthenticateUserError } from '../../modules/auth/usecases/google-auth/google-auth.errors.js';
import { ERemoveFromSlackErrors } from '../../modules/integrations/slack/usecases/remove-from-slack/remove-from-slack.errors.js';
import { EClientError } from '../domain/models/client.errors.js';
import { ETaskError } from '../domain/models/task.errors.js';

export enum EGeneralError {
  UnexpectedError = 'UNEXPECTED_ERROR',
  NotAuthenticatedError = 'USER_NOT_AUTHENTICATED',
}

export type EAppErrors =
  | EGeneralError
  | ETaskError
  | EClientError
  | ERemoveFromSlackErrors
  | EAuthenticateUserError;
