export interface VerifyEmailRequestDTO {
  token: string;
}

export interface IVerifyEmailResponceDTO {
  email: string;
  firstName: string;
  lastName: string;
  verified: boolean;
}
