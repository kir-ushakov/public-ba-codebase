/**
 * Authentication API DTOs
 */

import { UserDto } from './user.dto';

/**
 * Login Request DTO
 */
export interface LoginRequestDTO {
  username: string;
  password: string;
}

/**
 * Login Response DTO
 */
export interface LoginResponseDTO {
  user: UserDto;
  expireAt?: string;
}

/**
 * Sign Up Request DTO
 */
export interface SignUpRequestDTO {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

/**
 * Sign Up Response DTO
 */
export interface SignUpResponseDTO {
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Verify Email Response DTO
 */
export interface VerifyEmailResponseDTO {
  email: string;
  verified: boolean;
}

