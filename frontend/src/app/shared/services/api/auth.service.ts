import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserDto } from '../../dto/user.dto';
import { UserMapper } from '../../mappers/user.mapper';
import { User } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { environment as env } from 'src/environments/environment';

export type LoginRequestDTO = {
  username: string;
  password: string;
};

export type LoginResponseDTO = {
  user: UserDto;
  expireAt: string;
};

export type SignUpRequestDTO = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type SignUpResponseDTO = UserDto;

export type VerifyEmailResponseDTO = {
  email: string;
  verified: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  static readonly API_ENDPOINTS = {
    LOGIN: env.baseUrl + 'auth/login',
    LOGOUT: env.baseUrl + 'auth/logout',
    SIGNUP: env.baseUrl + 'auth/signup',
    VERIFY_EMAIL: env.baseUrl + 'auth/verify-email',
  };

  constructor(private http: HttpClient) {}

  public login(data: LoginRequestDTO): Observable<User> {
    return this.http.post<LoginResponseDTO>(AuthService.API_ENDPOINTS.LOGIN, data).pipe(
      map(date => {
        return UserMapper.toModel(date.user);
      }),
    );
  }

  public logout(): Observable<void> {
    return this.http.delete<void>(AuthService.API_ENDPOINTS.LOGOUT);
  }

  public signUp(data: SignUpRequestDTO): Observable<SignUpResponseDTO> {
    return this.http.post<SignUpResponseDTO>(AuthService.API_ENDPOINTS.SIGNUP, {
      ...data,
    });
  }
}
