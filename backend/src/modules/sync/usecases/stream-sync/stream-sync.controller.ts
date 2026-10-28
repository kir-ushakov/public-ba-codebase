import { Request, Response } from 'express';
import { UserPersistent } from '../../../../shared/domain/models/user.js';
import { BaseController } from '../../../../shared/infra/http/models/base-controller.js';
import { sseManager } from '../../../../shared/infra/sync-signal/sse-manager.js';

const HEARTBEAT_MS = 25_000;

export class StreamSyncController extends BaseController {
  protected executeImpl(req: Request, res: Response): Promise<void> {
    const authenticatedUser = req.user as UserPersistent;
    const userId = String(authenticatedUser._id);

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    sseManager.add(userId, res);
    res.write(': ok\n\n');

    const heartbeat = setInterval(() => {
      if (res.writableEnded || res.destroyed) {
        clearInterval(heartbeat);
        sseManager.remove(userId, res);
        return;
      }
      res.write(': ping\n\n');
    }, HEARTBEAT_MS);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseManager.remove(userId, res);
    });
    return Promise.resolve();
  }
}
