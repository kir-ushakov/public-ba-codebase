import { Injectable } from '@angular/core';
import { Change } from 'src/app/shared/models/change.model';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';
import { ChangeableObjectDTO, ChangeDTO, EChangeAction, EChangedEntity, SendChangeContract } from '@brainassistant/contracts';
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
      
      switch (change.action) {
        case EChangeAction.Created:
        case EChangeAction.Updated:
          const changeDto: ChangeDTO = ChangeMapper.toDto(change);

          const request: SendChangeContract.Request = {
            changeableObjectDto: changeDto.object as ChangeableObjectDTO,
          };
          
          return change.action === EChangeAction.Created
            ? this.http.post<SendChangeContract.Response>(path, request)
            : this.http.patch<SendChangeContract.Response>(path, request);
            
        case EChangeAction.Deleted:
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
}
