import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserDto } from '../dto/user.dto.js';
import { LoginResponseDTO } from '../usecases/login/login.dto.js';
import { User } from '../../../shared/domain/models/user.js';
import { UserMapper } from '../../../shared/mappers/user.mapper.js';

export class LoginService {
  /** JWT and cookie max-age: sliding renewal extends from each successful authenticated request */
  public static readonly JWT_TTL_SECONDS = 60 * 60;

  public static setJwtCookie(res: Response, loginResponseDto: LoginResponseDTO): void {
    const expiresIn = LoginService.JWT_TTL_SECONDS;
    const newToken = jwt.sign(loginResponseDto, process.env.JWT_SECRET, {
      expiresIn,
    });

    res.cookie('jwt', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      expires: new Date(new Date().getTime() + expiresIn * 1000),
    });
  }

  public login(
    user: User,
    req: Request,
    res: Response
  ): Promise<LoginResponseDTO> {
    return new Promise((resolve, reject) => {

      const userDto: UserDto = {
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.username.value,
        userId: user.id.toString(),
      };

      const loginResponseDto: LoginResponseDTO = { user: userDto };

      if (process.env.AUTHENTICATION_STRATEGY === 'SESSION') { 
        const userDBEnity = UserMapper.toDatabaseEntity(user);
        req.logIn(userDBEnity, (err) => {
          if (err) {
            return reject(err);
          }
          return resolve(loginResponseDto);
        });
      }

      if (process.env.AUTHENTICATION_STRATEGY === 'JWT') {
        LoginService.setJwtCookie(res, loginResponseDto);
        return resolve(loginResponseDto);
      }
    });
  }
}
