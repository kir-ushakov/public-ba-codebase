/**
 * #NOTE
 * The user model is a part of the application's business logic
 * because the user is the main actor in the application.
 * So the 'models' folder is a good place for it.
 */
export type User = {
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
};
