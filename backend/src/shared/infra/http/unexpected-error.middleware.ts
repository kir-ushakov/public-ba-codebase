import { ErrorRequestHandler } from 'express';
import { LoggerService } from '../../services/logger/logger.service.js';
import {
  BaseController,
  EHttpStatus,
  UNEXPECTED_ERROR_RESPONSE,
} from './models/base-controller.js';
import { toUnexpectedInfraServiceError } from './unexpected-infra.error.js';

/**
 * Catch-all for exceptions that called `next(err)` before a controller
 * (multer disk write, body parser, …). Not a UseCaseError bus: those stay Result values.
 */
export function unexpectedErrorHandler(logger: LoggerService): ErrorRequestHandler {
  return (err: unknown, _req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    logger.logServiceError(toUnexpectedInfraServiceError(err));
    BaseController.jsonResponse(res, EHttpStatus.InternalServerError, UNEXPECTED_ERROR_RESPONSE);
  };
}
