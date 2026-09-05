import passport from 'passport';
import type { NextFunction, Request, Response } from 'express';
import { LoginService } from '../../../modules/auth/services/login.service.js';
import type { UserDocument } from '../database/mongodb/user.model.js';
import { EHttpStatus } from '../http/models/base-controller.js';
import { IApiErrorDto } from '../http/dtos/api-errors.dto.js';

export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  const NOT_AUTHENTICATED_ERROR = 'USER_NOT_AUTHENTICATED';

  switch (process.env.AUTHENTICATION_STRATEGY) {
    case 'JWT':
      passport.authenticate('jwt', { session: false }, (error, user) => {
        if (error || !user) {
          const RESPONSE_CODE = EHttpStatus.Unauthorized;
          const RESPONSE_ERROR_MESSAGE = 'User not authenticated';

          const errorDto: IApiErrorDto = {
            name: NOT_AUTHENTICATED_ERROR,
            message: RESPONSE_ERROR_MESSAGE,
          };

          return res.status(RESPONSE_CODE).send(errorDto);
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
      break;

    case 'SESSION':
      if (req.isAuthenticated()) {
        next();
      } else {
        const errorDto: IApiErrorDto = {
          name: NOT_AUTHENTICATED_ERROR,
          message: 'User not authenticated',
        };
        res.status(401).send(errorDto);
      }
      break;
    default:
      throw new Error(`Not Supported Auth Strategy: ${process.env.AUTHENTICATION_STRATEGY}`);
  }
}
