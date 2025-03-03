export type User = {
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  googleId: string;
  googleRefreshToken?: string;
  googleAccessToken?: string;
};
