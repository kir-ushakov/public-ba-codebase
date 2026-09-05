export type VerifyEmailRequestDTO = {
  token: string;
};

export type VerifyEmailResponseDTO = {
  email: string;
  firstName: string;
  lastName: string;
  verified: boolean;
};
