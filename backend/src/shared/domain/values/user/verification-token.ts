import mongoose from "mongoose";
import { Result } from "../../../core/Result";
import { ValueObject } from "../../ValueObject";

export interface IVerificationTokenProps {
  userId: mongoose.Types.ObjectId,
  token: string,
  createdAt: Date
}

export class VerificationToken extends ValueObject<IVerificationTokenProps> {

  get value(): IVerificationTokenProps {
    return this.props;
  }

  get userId(): mongoose.Types.ObjectId {
    return this.props.userId; 
  }

  get token(): string {
    return this.props.token;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: IVerificationTokenProps) {
    super(props);
  }

  public static create(props?: IVerificationTokenProps): Result<VerificationToken> {
    return Result.ok<VerificationToken>(new VerificationToken(props));
  }
}
