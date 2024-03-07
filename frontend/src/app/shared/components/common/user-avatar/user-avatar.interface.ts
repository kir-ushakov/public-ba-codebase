/**
 * #NOTE
 * This Input Interface describes what the component expects as parameters
 * to make it easy to use across the project
 * and also prevents input type errors at compile time.
 */
export interface IUserAvatarInputData {
  firstLetter: string;
  color?: string;
  photoUrl?: string;
}
