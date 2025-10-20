/**
 * User Data Transfer Object
 * Shared contract between frontend and backend for user data
 */
export interface UserDto {
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
}

