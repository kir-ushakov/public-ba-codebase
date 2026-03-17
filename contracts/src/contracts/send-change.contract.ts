import { ChangeableObjectDTO } from "../dto";

/**
 * Send Change Contract
 * Used for POST/PATCH/DELETE requests to sync endpoints
 * 
 * Examples:
 * - POST /api/sync/task { changeableObjectDto: TaskDTO } → Returns TaskDTO
 * - PATCH /api/sync/task { changeableObjectDto: TaskDTO } → Returns TaskDTO
 * - DELETE /api/sync/task/:id → Returns void
 */
export namespace SendChangeContract {
  /**
   * Request for sending a change to the server
   * Generic type T allows specific DTO types (TaskDTO, TagDTO, etc.)
   */
  export type Request<T extends ChangeableObjectDTO = ChangeableObjectDTO> = {
    changeableObjectDto: T;
  };

  /**
   * Response for sending a change to the server
   * 
   * Returns the created/updated entity for POST/PATCH requests.
   * This confirms what the server actually saved (server is source of truth).
   * 
   * For DELETE requests, returns void.
   */
  export type Response<T extends ChangeableObjectDTO = ChangeableObjectDTO> = T | void;
}

