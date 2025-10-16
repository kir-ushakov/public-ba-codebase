import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';
import { ChangeDTO } from '@brainassistant/contracts';
import { HttpClient } from '@angular/common/http';
import { convertObjectToUrlParams } from '../../helpers/convert-object-to-url-params.function';
import { Observable, map } from 'rxjs';
import { ChangeMapper } from '../../mappers';
import { Change } from '../../models';

interface GetChangesResponceDTO {
  changes: ChangeDTO[];
}
@Injectable({
  providedIn: 'root',
})
export class ServerChangesService {
  constructor(private http: HttpClient) {}

  public fetch(clientId: string): Observable<Change[]> {
    const queryString: string = convertObjectToUrlParams({
      clientId,
    });
    return this.http
      .get<GetChangesResponceDTO>(`${API_ENDPOINTS.SYNC.CHANGES}?${queryString}`)
      .pipe(
        map(response => {
          const changeDTOs: ChangeDTO[] = response.changes;
          const changes: Array<Change> = changeDTOs.map(dto => ChangeMapper.toModel(dto));
          return changes;
        }),
      );
  }
}
