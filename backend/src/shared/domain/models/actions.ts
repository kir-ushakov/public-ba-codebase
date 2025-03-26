import { EActionType } from '../../infra/database/mongodb/action.model.js';
import { ValueObject } from '../ValueObject.js';

export interface IActionProps {
  userId: string;
  type: EActionType;
  occurredAt: Date;
  entityId: string;
}

export class Action extends ValueObject<IActionProps> {
  get userId(): string {
    return this.props.userId;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }

  get type(): EActionType {
    return this.props.type;
  }

  get entityId(): string {
    return this.props.entityId;
  }

  private constructor(props: IActionProps) {
    super(props);
  }

  public static create(props: IActionProps): Action {
    const action = new Action(props);

    return action;
  }
}
