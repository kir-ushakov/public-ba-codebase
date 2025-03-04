import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClientIdService {
  public static readonly SYNC_INTERVAL: number = 30 * 1000; // 30 secs
  public static readonly FAIL_MESSAGE = 'Synchronization Failed :(';

  constructor(private http: HttpClient) {}

  public releaseClientId(): Observable<string> {
    return this.http
      .get<IReleaseClientIdResponseDTO>(API_ENDPOINTS.SYNC.RELEASE_CLIENTID)
      .pipe(map((res: IReleaseClientIdResponseDTO) => res.clientId));
  }
}

export interface IReleaseClientIdResponseDTO {
  clientId: string;
}
