import { User, UserPersistent } from '../domain/models/user.js';
import { UniqueEntityID } from '../domain/UniqueEntityID.js';
import { UserEmail } from '../domain/values/user/user-email.js';
import UserModel from '../infra/database/mongodb/user.model.js';

export class UserMapper {
  public static toDomain(raw: UserPersistent): User {
    const userEmailOrError = UserEmail.create(raw.username);
    const userFirstName = raw.firstName; // TODO - need to use ValueObject for firstName
    const userLastName = raw.lastName; // TODO - need to use ValueObject for lastName

    const userOrError = User.create(
      {
        username: userEmailOrError.getValue(),
        firstName: userFirstName,
        lastName: userLastName,
        googleId: raw.googleId,
        googleRefreshToken: raw.googleRefreshToken,
        googleAccessToken: raw.googleAccessToken,
      },
      new UniqueEntityID(raw._id)
    );

    if (userOrError.isFailure) {
      console.log(userOrError.error);
      throw new Error("Can't create User from UserPersistent");
    } else {
      return userOrError.getValue();
    }
  }

  public static toPersistence(user: User): UserPersistent {
    return {
      username: user.username.value,
      firstName: user.firstname,
      lastName: user.lastname,
      verified: user.verified,
      googleId: user.googleId,
      googleRefreshToken: user.googleRefreshToken,
      googleAccessToken: user.googleAccessToken,
    };
  }

  public static toDatabaseEntity(user: User): Record<string, any> {
    // TODO: pass DBModel as dependency to make method db agnostic
    const DBModel = UserModel;
    return new DBModel ({
      id: user.id.toValue(),
      username: user.username.value,
      firstName: user.firstname,
      lastName: user.lastname,
      verified: user.verified,
      googleId: user.googleId,
      googleRefreshToken: user.googleRefreshToken,
      googleAccessToken: user.googleAccessToken,
    });
  }
}
