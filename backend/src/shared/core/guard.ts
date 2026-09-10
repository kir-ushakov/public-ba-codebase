export class Guard {
  public static notNullOrUndefined(argument: unknown): boolean {
    if (argument === null || argument === undefined) {
      return false;
    } else {
      return true;
    }
  }

  public static notEmptyString(argument: unknown): boolean {
    return typeof argument === 'string' && argument.trim().length > 0;
  }

  public static textLengthAtLeast(text: unknown, minLength: number): boolean {
    return typeof text === 'string' && text.trim().length >= minLength;
  }
  public static textLengthAtMost(text: unknown, maxLength: number): boolean {
    return typeof text === 'string' && text.trim().length <= maxLength;
  }
}
