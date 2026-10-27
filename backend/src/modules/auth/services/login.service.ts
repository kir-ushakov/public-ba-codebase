import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserDto } from '../dto/user.dto.js';
import { LoginResponseDTO } from '../usecases/login/login.dto.js';
import { User } from '../../../shared/domain/models/user.js';
import { requiredEnv } from '../../../config/index.js';

export class LoginService {
  /** JWT and cookie max-age: sliding renewal extends from each successful authenticated request */
  public static readonly JWT_TTL_SECONDS = 60 * 60;

  public static setJwtCookie(res: Response, loginResponseDto: LoginResponseDTO): void {
    const expiresIn = LoginService.JWT_TTL_SECONDS;
    const newToken = jwt.sign(loginResponseDto, requiredEnv('JWT_SECRET'), {
      expiresIn,
    });

    res.cookie('jwt', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      expires: new Date(new Date().getTime() + expiresIn * 1000),
    });
  }

  public login(user: User, res: Response): Promise<LoginResponseDTO> {
    const userDto: UserDto = {
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.username.value,
      userId: user.id.toString(),
    };

    const loginResponseDto: LoginResponseDTO = { user: userDto };
    LoginService.setJwtCookie(res, loginResponseDto);
    return Promise.resolve(loginResponseDto);
  }
}
