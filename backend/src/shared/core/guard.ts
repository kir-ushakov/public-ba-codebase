export class Guard {
  public static notNullOrUndefined(argument: any): boolean {
    if (argument === null || argument === undefined) {
      return false;
    } else {
      return true;
    }
  }

  public static notEmptyString(argument: string): boolean {
    if (typeof argument === 'string' && argument.trim().length) {
      return true;
    } else {
      return false;
    }
  }

  public static textLengthAtLeast(text: string, minLength: number) {
    if (typeof text === 'string' && text.trim().length >= minLength)
      return true;
    return false;
  }
  public static textLengthAtMost(text: string, maxLength: number) {
    if (typeof text === 'string' && text.trim().length <= maxLength)
      return true;
    return false;
  }
}
