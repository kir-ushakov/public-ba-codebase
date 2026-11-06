import passport from 'passport';
import type { NextFunction, Request, Response } from 'express';
import { EHttpStatus } from '../http/models/base-controller.js';
import { IApiErrorDto } from '../http/dtos/api-errors.dto.js';

export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  const NOT_AUTHENTICATED_ERROR = 'USER_NOT_AUTHENTICATED';

  passport.authenticate('jwt', { session: false }, (error: unknown, user?: Express.User) => {
    if (error || !user) {
      const errorDto: IApiErrorDto = {
        name: NOT_AUTHENTICATED_ERROR,
        message: 'User not authenticated',
      };

      return res.status(EHttpStatus.Unauthorized).send(errorDto);
    }
    req.user = user;
    // The access cookie is not reissued here. It dies at exp unless
    // POST /api/auth/refresh replaces it, so a stolen jwt cannot extend itself.
    next();
  })(req, res, next);
}
