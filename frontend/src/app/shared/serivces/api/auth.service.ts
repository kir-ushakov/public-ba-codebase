import { Injectable } from '@angular/core';
import { UserDto } from '../../dto/user.dto';
import { UserMapper } from '../../mappers/user.mapper';
import { User } from '../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { convertObjectToUrlParams } from '../../helpers/convert-object-to-url-params.function';
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

  public async login(data: LoginRequestDTO): Promise<User> {
    try {
      const res: LoginResponseDTO = await this.http
        .post<LoginResponseDTO>(AuthService.API_ENDPOINTS.LOGIN, data)
        .toPromise();

      const user: User = UserMapper.toModel(res.user);
      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.http.delete(AuthService.API_ENDPOINTS.LOGOUT).toPromise();
    } catch (error) {
      console.log('Logout request to server failed');
      console.log(error);
      throw error;
    }
  }

  public async signUp(data: SignUpRequestDTO): Promise<SignUpResponseDTO> {
    try {
      const response: SignUpResponseDTO = await this.http
        .post<SignUpResponseDTO>(AuthService.API_ENDPOINTS.SIGNUP, { ...data })
        .toPromise();
      return response;
    } catch (error) {
      console.log('SignUp request to server failed');
      console.log(error);
      throw error;
    }
  }

  public async verifyUserEmailWithToken(
    token: string
  ): Promise<VerifyEmailResponseDTO> {
    try {
      const queryString: string = convertObjectToUrlParams({
        token: token,
      });
      const response: VerifyEmailResponseDTO = await this.http
        .get<VerifyEmailResponseDTO>(
          `${AuthService.API_ENDPOINTS.VERIFY_EMAIL}?${queryString}`
        )
        .toPromise();
      return response;
    } catch (error) {
      console.log('Verify User Email With Token request to server failed');
      console.log(error);
      throw error;
    }
  }
}
