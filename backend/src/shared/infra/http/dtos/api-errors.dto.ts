import { EAppErrors } from '../../../core/app-error.enum.js';

// TODO: Need to remove this interface
// TOCKET: https://brainas.atlassian.net/browse/BA-117
export interface IApiErrorDto {
  name: EAppErrors;
  message: string;
}
