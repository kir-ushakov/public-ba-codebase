import { ErrorRequestHandler } from 'express';
import { LoggerService } from '../../../services/logger/logger.service.js';
import {
  BaseController,
  EHttpStatus,
  UNEXPECTED_ERROR_RESPONSE,
} from '../models/base-controller.js';
import { toAppErrorFromThrown } from './to-app-error-from-thrown.error.js';

/**
 * Catch-all for exceptions that called `next(err)` before a controller.
 * Known storage errno → AppError; anything else is logged raw, not forced into ServiceError.
 */
export function unexpectedErrorHandler(logger: LoggerService): ErrorRequestHandler {
  return (err: unknown, _req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    const appError = toAppErrorFromThrown(err);
    if (appError) {
      logger.logAppError(appError);
    } else {
      logger.logUnexpectedError(err);
    }

    BaseController.jsonResponse(res, EHttpStatus.InternalServerError, UNEXPECTED_ERROR_RESPONSE);
  };
}
