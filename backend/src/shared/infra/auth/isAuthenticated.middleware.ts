import passport from 'passport';
import type { NextFunction, Request, Response } from 'express';
import { LoginService } from '../../../modules/auth/services/login.service.js';
import type { UserDocument } from '../database/mongodb/user.model.js';
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
    const doc = user as UserDocument;
    LoginService.setJwtCookie(res, {
      user: {
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.username,
        userId: doc._id.toString(),
      },
    });
    next();
  })(req, res, next);
}
