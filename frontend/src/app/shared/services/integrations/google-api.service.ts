import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../../models';
import { LoginResponseDTO } from '../api/auth.service';
import { UserMapper } from '../../mappers';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GoogleAPIService {
  static readonly AUTH_API_ENDPOINT = `${environment.baseUrl}integrations/google/auth`;

  constructor(private http: HttpClient) {}

  authenticateUser(code: string) {
    let params = new HttpParams().set('code', code);
    return this.http
      .get<LoginResponseDTO>(GoogleAPIService.AUTH_API_ENDPOINT, {
        headers: null,
        params: params,
      })
      .pipe(
        map(date => {
          return UserMapper.toModel(date.user);
        }),
      );
  }
}
