export class DomainError {
  public readonly name: string;
  public readonly message: string;
  public readonly error: any;

  constructor(name: string, message: string, error: any = null) {
    this.message = message;
    this.error = error;
    this.name = name;
  }
}
