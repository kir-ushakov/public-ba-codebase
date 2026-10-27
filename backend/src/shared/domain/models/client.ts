import { AggregateRoot } from '../AggregateRoot.js';
import { UniqueEntityID } from '../UniqueEntityID.js';
import { Result } from '../../core/result.js';

export interface IClientProps {
  userId: string;
}

export class Client extends AggregateRoot<IClientProps> {
  get id(): UniqueEntityID {
    return this._id;
  }

  get userId(): string {
    return this.props.userId;
  }

  public static create(props: IClientProps, id?: UniqueEntityID): Result<Client, never> {
    const client = new Client({ ...props }, id);

    return Result.ok<Client, never>(client);
  }

  private constructor(props: IClientProps, id?: UniqueEntityID) {
    super(props, id);
  }
}
