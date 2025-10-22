/**
 * Tag Data Transfer Object
 * Shared contract between frontend and backend for tag data
 */
export interface TagDTO {
  id: string;
  userId: string;
  isCategory: boolean;
  name: string;
  color: string;
  createdAt: string;
  modifiedAt: string;
}

