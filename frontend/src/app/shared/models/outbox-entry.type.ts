import { Change } from './change.model';

/** One pending sync operation. `id` identifies this row, not the entity. */
export type OutboxEntry = {
  id: string;
  entityId: string;
  change: Change;
};
