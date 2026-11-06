/**
 * Tag Data Transfer Object
 * Shared contract between frontend and backend for tag data
 */
export interface TagDTO {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
  modifiedAt: string;
  /**
   * Quick filter on Home. Omitted by older clients and by documents written
   * before pinning existed. Missing means not pinned.
   */
  isPinned?: boolean;
}

