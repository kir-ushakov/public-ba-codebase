import { User } from '../domain/models/user';

export interface UseCase<IRequest, IResponse> {
  execute(request?: IRequest, user?: User): Promise<IResponse> | IResponse;
}
