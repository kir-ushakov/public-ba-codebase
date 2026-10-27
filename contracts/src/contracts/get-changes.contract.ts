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
 * - GET /api/sync/changes?afterRevision=15 → Returns changes and the revision they cover
 */
export namespace GetChangesContract {
  /**
   * Request for getting changes from server.
   * Sent as a query parameter: GET /api/sync/changes?afterRevision=15
   */
  export type Request = {
    /**
     * Return rows with syncRevision greater than this number.
     * Absent or invalid means 0.
     */
    afterRevision?: string;
  };

  /**
   * Response for fetching changes from server.
   * The client stores syncRevision only after it has saved changes.
   */
  export type Response = {
    changes: ChangeDTO[];
    /**
     * Highest revision covered by this response. Equals afterRevision when
     * there is nothing new.
     */
    syncRevision: number;
  };
}

