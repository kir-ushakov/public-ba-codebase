import { ChangeDTO } from '../../domain/dtos/change.dto.js';

export interface IGetChangesRequestDTO {
  userId: string;
  clientId: string;
}

export interface IGetChangesResponseDTO {
  changes: ChangeDTO[];
}
