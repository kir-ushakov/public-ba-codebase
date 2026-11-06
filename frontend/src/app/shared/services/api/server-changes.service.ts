import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';
import { ChangeDTO, GetChangesContract } from '@brainassistant/contracts';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ChangeMapper } from '../../mappers';
import { Change } from '../../models';

export type ServerChangesPage = {
  changes: Change[];
  syncRevision: number;
};

@Injectable({
  providedIn: 'root',
})
export class ServerChangesService {
  constructor(private http: HttpClient) {}

  public fetch(afterRevision: number): Observable<ServerChangesPage> {
    const request: GetChangesContract.Request = {
      afterRevision: String(afterRevision),
    };
    return this.http
      .get<GetChangesContract.Response>(`${API_ENDPOINTS.SYNC.CHANGES}`, { params: request })
      .pipe(
        map((response: GetChangesContract.Response) => {
          const changeDTOs: ChangeDTO[] = response.changes;
          const changes: Array<Change> = changeDTOs.map(dto => ChangeMapper.toModel(dto));
          return { changes, syncRevision: response.syncRevision };
        }),
      );
  }
}
