import { UserDto } from '../dto/user.dto';
import { User } from '../models/user.model';

export class UserMapper {
  public static toModel(userDto: UserDto): User {
    return {
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      email: userDto.email,
      userId: userDto.userId,
    } as User;
  }
}
