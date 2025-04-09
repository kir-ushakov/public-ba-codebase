import { User } from '../domain/models/user.js';

export interface UseCase<IRequest, IResponse> {
  execute(request?: IRequest, user?: User): Promise<IResponse> | IResponse;
}
