/**
 * Sync available contract
 *
 * Server-sent event on GET /api/sync/stream.
 * The event name on the wire is `sync.available`.
 *
 * `version` tells the client that a newer revision exists. The client must
 * pull GET /api/sync/changes and store the revision from that response.
 * Old cached clients never open this stream and keep polling.
 */
export namespace SyncAvailableContract {
  export type Event = {
    version: number;
  };
}
