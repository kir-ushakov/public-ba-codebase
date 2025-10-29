/**
 * Standard API response DTOs
 */
export interface ApiErrorDto {
  name: string;
  message: string;
}

export interface ApiSuccessDto<T = any> {
  data: T;
}


