/**
 * Get Changes Contract
 * 
 * Defines the contract for fetching changes from the server.
 * Groups Request and Response types for clear relationship.
 */

import { ChangeDTO } from '../dto/change.dto';

/**
 * Get Changes Contract
 * Used for GET /api/sync/changes endpoint
 * 
 * Example:
 * - GET /api/sync/changes?clientId=abc123 → Returns { changes: ChangeDTO[] }
 */
export namespace GetChangesContract {
  /**
   * Request for getting changes from server
   * Sent as query parameter: GET /api/sync/changes?clientId=abc123
   */
  export type Request = {
    clientId: string;
  };

  /**
   * Response for fetching changes from server
   * Returns array of changes that occurred since last sync
   */
  export type Response = {
    changes: ChangeDTO[];
  };
}

