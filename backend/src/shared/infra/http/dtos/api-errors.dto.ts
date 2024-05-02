import { AppError } from '../../../core/app-error';

// TODO: Need to remove this interface
// TOCKET: https://brainas.atlassian.net/browse/BA-117
export interface IApiErrorDto {
  name: AppError;
  message: string;
}
