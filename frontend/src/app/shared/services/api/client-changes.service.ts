import { Injectable } from '@angular/core';
import { Change } from 'src/app/shared/models/change.model';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';
import { ChangeDTO, EChangeAction, EChangedEntity, SendChangeContract } from '@brainassistant/contracts';
import { ChangeMapper } from '../../mappers/change.mapper';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClientChangesService {
  static readonly SYNC_REQUESTS_MAP = {
    [EChangedEntity.Task]: {
      endpoint: API_ENDPOINTS.SYNC.TASK,
    },
    [EChangedEntity.Tag]: {
      endpoint: API_ENDPOINTS.SYNC.TAG,
    },
  };

  constructor(private http: HttpClient) {}

  public send(change: Change): Observable<SendChangeContract.Response> {
    try {
      const path = this.getPath(change);
      const payload = this.getPayLoad(change);
      
      switch (change.action) {
        case EChangeAction.Created:
        case EChangeAction.Updated:
          const requestBody: SendChangeContract.Request = {
            changeableObjectDto: payload,
          };
          
          // POST/PATCH return the created/updated entity
          return change.action === EChangeAction.Created
            ? this.http.post<SendChangeContract.Response>(path, requestBody)
            : this.http.patch<SendChangeContract.Response>(path, requestBody);
            
        case EChangeAction.Deleted:
          // DELETE returns void
          return this.http.delete<SendChangeContract.Response>(path);
      }
    } catch (err) {
      console.error(err);
      return throwError(() => err);
    }
  }

  private getPath(change: Change): string {
    if (change.action === EChangeAction.Deleted) {
      return (
        ClientChangesService.SYNC_REQUESTS_MAP[change.entity].endpoint + '/' + change.object.id
      );
    } else {
      return ClientChangesService.SYNC_REQUESTS_MAP[change.entity].endpoint;
    }
  }

  private getPayLoad(change: Change) {
    if (change.action === EChangeAction.Deleted) return null;
    const changeDto: ChangeDTO = ChangeMapper.toDto(change);
    return changeDto.object;
  }
}
