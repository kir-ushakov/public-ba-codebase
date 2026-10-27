import { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserDto } from '../dto/user.dto.js';
import { LoginResponseDTO } from '../usecases/login/login.dto.js';
import { User } from '../../../shared/domain/models/user.js';
import { requiredEnv } from '../../../config/index.js';
import { RefreshSessionRepo } from '../../../shared/repo/refresh-session.repo.js';
import { createRefreshToken, hashRefreshToken } from './refresh-token.function.js';

export class LoginService {
  /** JWT and cookie max-age: sliding renewal extends from each successful authenticated request */
  public static readonly JWT_TTL_SECONDS = 60 * 60;
  /** Refresh cookie lifetime, sliding from each successful POST /api/auth/refresh */
  public static readonly REFRESH_TTL_SECONDS = 14 * 24 * 60 * 60;
  public static readonly REFRESH_COOKIE_NAME = 'refresh';
  public static readonly REFRESH_COOKIE_PATH = '/api/auth';

  constructor(private readonly refreshSessions: RefreshSessionRepo) {}

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

  public static setRefreshCookie(res: Response, rawToken: string, expiresAt: Date): void {
    res.cookie(LoginService.REFRESH_COOKIE_NAME, rawToken, {
      ...LoginService.refreshCookieOptions(),
      expires: expiresAt,
    });
  }

  public static clearJwtCookie(res: Response): void {
    res.clearCookie('jwt');
  }

  public static clearRefreshCookie(res: Response): void {
    res.clearCookie(LoginService.REFRESH_COOKIE_NAME, LoginService.refreshCookieOptions());
  }

  public async login(user: User, res: Response): Promise<LoginResponseDTO> {
    const loginResponseDto = LoginService.toLoginResponse(user);
    const refresh = await this.createRefreshSession(user.id.toString());
    LoginService.setJwtCookie(res, loginResponseDto);
    LoginService.setRefreshCookie(res, refresh.rawToken, refresh.expiresAt);
    return loginResponseDto;
  }

  public async createRefreshSession(
    userId: string,
  ): Promise<{ rawToken: string; expiresAt: Date }> {
    const rawToken = createRefreshToken();
    const expiresAt = new Date(Date.now() + LoginService.REFRESH_TTL_SECONDS * 1000);
    await this.refreshSessions.insert({
      userId,
      tokenHash: hashRefreshToken(rawToken),
      expiresAt,
    });
    return { rawToken, expiresAt };
  }

  private static toLoginResponse(user: User): LoginResponseDTO {
    const userDto: UserDto = {
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.username.value,
      userId: user.id.toString(),
    };
    return { user: userDto };
  }

  private static refreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      path: LoginService.REFRESH_COOKIE_PATH,
    };
  }
}
