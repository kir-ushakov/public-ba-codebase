import { User, UserPersistent } from '../domain/models/user';
import { UniqueEntityID } from '../domain/UniqueEntityID';
import { UserEmail } from '../domain/values/user/user-email';

export class UserMapper {
  public static toDomain(raw: UserPersistent): User {
    const userEmailOrError = UserEmail.create(raw.username);
    const userFirstName = raw.firstName; // TODO - need to use ValueObject for firstName
    const userLastName = raw.lastName; // TODO - need to use ValueObject for lastName
    const userGoogleId = raw.googleId;

    const userOrError = User.create(
      {
        username: userEmailOrError.getValue(),
        firstName: userFirstName,
        lastName: userLastName,
        googleId: userGoogleId,
      },
      new UniqueEntityID(raw._id)
    );

    // TODO - I think this error should float upper
    userOrError.isFailure ? console.log(userOrError.error) : '';
    return userOrError.isSuccess ? userOrError.getValue() : null;
  }

  public static toPersistence(user: User): UserPersistent {
    return {
      username: user.username.value,
      firstName: user.firstname,
      lastName: user.lastname,
      verified: user.verified,
      googleId: user.googleId,
    };
  }
}
