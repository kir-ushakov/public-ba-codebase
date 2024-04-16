import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserPersistent } from '../../../shared/domain/models/user';
import { UserDto } from '../dto/user.dto';
import { LoginResponseDTO } from '../useCases/login/login.dto';

export class LoginService {
  public login(
    user: UserPersistent,
    req: Request,
    res: Response
  ): Promise<LoginResponseDTO> {
    return new Promise((resolve, reject) => {
      const userDto: UserDto = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.username,
        userId: user._id,
      };

      const loginResponseDto: LoginResponseDTO = { user: userDto };

      if (process.env.AUTHENTICATION_STRATEGY === 'SESSION') {
        req.logIn(user, (err) => {
          if (err) {
            return reject(err);
          }
          return resolve(loginResponseDto);
        });
      }

      if (process.env.AUTHENTICATION_STRATEGY === 'JWT') {
        const expiresIn = 60 * 60;
        const newToken = jwt.sign(loginResponseDto, process.env.JWT_SECRET, {
          expiresIn: expiresIn,
        });

        res.cookie('jwt', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV !== 'development',
          expires: new Date(new Date().getTime() + expiresIn * 1000),
        });
        return resolve(loginResponseDto);
      }
    });
  }
}
