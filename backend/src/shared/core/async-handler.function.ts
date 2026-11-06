import { Request, Response, NextFunction, RequestHandler } from 'express';
import { runWithSyncNotificationScope } from '../infra/sync-signal/sync-notification.js';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    void runWithSyncNotificationScope(() => fn(req, res, next)).catch(next);
  };
}
