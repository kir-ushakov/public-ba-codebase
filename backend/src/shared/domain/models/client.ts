import { AggregateRoot } from '../AggregateRoot';
import { UniqueEntityID } from '../UniqueEntityID';
import { Result } from '../../core/Result';

export interface IClientProps {
  userId: string;
  syncTime: Date;
}

export class Client extends AggregateRoot<IClientProps> {
  get id(): UniqueEntityID {
    return this._id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get syncTime(): Date {
    return this.props.syncTime;
  }

  public static create(
    props: IClientProps,
    id?: UniqueEntityID
  ): Result<Client> {
    const client = new Client(props, id);

    return Result.ok<Client>(client);
  }

  public updateSyncTime(time: Date): void {
    this.props.syncTime = time;
  }

  private constructor(props: IClientProps, id?: UniqueEntityID) {
    super(props, id);
  }
}
