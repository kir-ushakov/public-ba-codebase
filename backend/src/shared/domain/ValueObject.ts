export abstract class ValueObject<T extends object> {
  public props: T;

  constructor(props: T) {
    this.props = {
      ...props,
    };
  }

  public equals(vObj?: ValueObject<T>): boolean {
    if (vObj === null || vObj === undefined) {
      return false;
    }
    if (vObj.props === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(vObj.props);
  }
}
