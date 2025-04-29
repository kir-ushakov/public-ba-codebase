import { Injectable } from '@angular/core';
import { Change, EChangeAction, EChangedEntity } from 'src/app/shared/models/change.model';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';
import { ChangeDTO } from '../../dto/change.dto';
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

  public send(change: Change): Observable<void> {
    try {
      const path = this.getPath(change);
      const payload = this.getPayLoad(change);
      switch (change.action) {
        case EChangeAction.Created:
          return this.http.post<void>(path, { changeableObjectDto: payload });
        case EChangeAction.Updated:
          return this.http.patch<void>(path, { changeableObjectDto: payload });
        case EChangeAction.Deleted:
          return this.http.delete<void>(path);
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
