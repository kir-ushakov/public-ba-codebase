import passport from 'passport';
import { EAppError } from '../../core/app-error.js';
import { EHttpStatus } from '../http/models/base-controller.js';
import { IApiErrorDto } from '../http/dtos/api-errors.dto.js';

export function isAuthenticated(req, res, next) {
  switch (process.env.AUTHENTICATION_STRATEGY) {
    case 'JWT':
      passport.authenticate('jwt', { session: false }, async (error, user) => {
        if (error || !user) {
          const errorDto: IApiErrorDto = {
            name: EAppError.UserNotAuthenticated,
            message: 'User not authenticated',
          };
          return res.status(EHttpStatus.Unauthorized).send(errorDto);
        }
        req.user = user;
        next();
      })(req, res, next);
      break;

    case 'SESSION':
      if (req.isAuthenticated()) {
        return next();
      } else {
        const errorDto: IApiErrorDto = {
          name: EAppError.UserNotAuthenticated,
          message: 'User not authenticated',
        };
        return res.status(401).send(errorDto);
      }
    default:
      throw new Error(
        `Not Supported Auth Strategy: ${process.env.AUTHENTICATION_STRATEGY}`
      );
  }
}
