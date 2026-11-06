import { randomUUID } from 'node:crypto';
import { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserDto } from '../dto/user.dto.js';
import { LoginResponseDTO } from '../usecases/login/login.dto.js';
import { User } from '../../../shared/domain/models/user.js';
import { requiredEnv } from '../../../config/index.js';
import { RefreshSessionRepo } from '../../../shared/repo/refresh-session.repo.js';
import { createRefreshToken, hashRefreshToken } from './refresh-token.function.js';

export class LoginService {
  /** Access-token lifetime from login or POST /api/auth/refresh. Requests do not extend it. */
  public static readonly JWT_TTL_SECONDS = 60 * 60;
  /** Refresh-session lifetime from login or POST /api/auth/refresh. */
  public static readonly REFRESH_TTL_SECONDS = 14 * 24 * 60 * 60;
  /**
   * A second use of a refresh token inside this window is a lost race between
   * two callers. Outside it, the whole login family is revoked.
   */
  public static readonly REFRESH_REUSE_GRACE_MS = 10_000;
  public static readonly REFRESH_COOKIE_NAME = 'refresh';
  public static readonly REFRESH_COOKIE_PATH = '/api/auth';

  constructor(private readonly refreshSessions: RefreshSessionRepo) {}

  public static setJwtCookie(
    res: Response,
    loginResponseDto: LoginResponseDTO,
    sessionId: string,
  ): void {
    const expiresIn = LoginService.JWT_TTL_SECONDS;
    const newToken = jwt.sign({ ...loginResponseDto, sid: sessionId }, requiredEnv('JWT_SECRET'), {
      expiresIn,
    });

    res.cookie('jwt', newToken, {
      ...LoginService.jwtCookieOptions(),
      expires: new Date(Date.now() + expiresIn * 1000),
    });
  }

  public static setRefreshCookie(res: Response, rawToken: string, expiresAt: Date): void {
    res.cookie(LoginService.REFRESH_COOKIE_NAME, rawToken, {
      ...LoginService.refreshCookieOptions(),
      expires: expiresAt,
    });
  }

  public static clearJwtCookie(res: Response): void {
    res.clearCookie('jwt', LoginService.jwtCookieOptions());
  }

  public static clearRefreshCookie(res: Response): void {
    res.clearCookie(LoginService.REFRESH_COOKIE_NAME, LoginService.refreshCookieOptions());
  }

  public async login(user: User, res: Response): Promise<LoginResponseDTO> {
    const loginResponseDto = LoginService.toLoginResponse(user);
    const refresh = await this.createRefreshSession(user.id.toString());
    LoginService.setJwtCookie(res, loginResponseDto, refresh.sessionId);
    LoginService.setRefreshCookie(res, refresh.rawToken, refresh.expiresAt);
    return loginResponseDto;
  }

  public async createRefreshSession(
    userId: string,
    familyId?: string,
  ): Promise<{ rawToken: string; expiresAt: Date; sessionId: string }> {
    const rawToken = createRefreshToken();
    const expiresAt = new Date(Date.now() + LoginService.REFRESH_TTL_SECONDS * 1000);
    const resolvedFamilyId = familyId ?? randomUUID();
    const sessionId = await this.refreshSessions.insert({
      userId,
      tokenHash: hashRefreshToken(rawToken),
      expiresAt,
      familyId: resolvedFamilyId,
    });
    if (familyId) {
      await this.refreshSessions.extendFamily(resolvedFamilyId, expiresAt);
    }
    return { rawToken, expiresAt, sessionId };
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

  private static jwtCookieOptions(): CookieOptions {
    return LoginService.cookieOptions('/');
  }

  private static refreshCookieOptions(): CookieOptions {
    return LoginService.cookieOptions(LoginService.REFRESH_COOKIE_PATH);
  }

  private static cookieOptions(path: string): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path,
    };
  }
}
