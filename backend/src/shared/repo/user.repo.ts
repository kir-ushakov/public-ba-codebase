import mongoose, { PassportLocalModel } from 'mongoose';
import { IDbModels } from '../infra/database/mongodb';
import { UserEmail } from '../domain/values/user/user-email';
import { UserDocument } from '../infra/database/mongodb/user.model';
import { User, UserPersistent } from '../domain/models/user';
import { UserMapper } from '../mappers/user.mapper';
import { VerificationTokenDocumnet } from '../infra/database/mongodb/verification-token.model';
import {
  IVerificationTokenProps,
  VerificationToken,
} from '../domain/values/user/verification-token';
import { Result } from '../core/Result';

export class UserRepo {
  private _models: IDbModels;

  constructor(models: IDbModels) {
    this._models = models;
  }

  public async exist(userEmail: UserEmail): Promise<boolean> {
    const UserModel = this._models.UserModel;
    const existingEmail = await UserModel.findOne({
      username: userEmail.value,
    });
    const found: boolean = !!existingEmail === true;
    return found;
  }

  public async create(user: User, password: string): Promise<UserDocument> {
    const userData: UserPersistent = UserMapper.toPersistence(user);

    const UserModel: PassportLocalModel<UserDocument> = this._models.UserModel;

    const userDocument: UserDocument = new UserModel({
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      googleId: userData.googleId,
      verified: userData.verified,
    });

    return await UserModel.register(userDocument, password);
  }

  public async findUserById(
    userId: mongoose.Types.ObjectId | string
  ): Promise<User> {
    const UserModel = this._models.UserModel;
    // TODO: Do we need to convert string -> ObjectId ? or we can use string directly?
    userId =
      typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    const userDocument: UserDocument = await UserModel.findOne({ _id: userId });
    const found = !!userDocument === true;
    if (!found) throw new Error(`User with id ${userId} not found`);
    const user: User = UserMapper.toDomain(userDocument);
    return user;
  }

  public async getTokenByTokenId(tokenId: string): Promise<VerificationToken> {
    const VerificationTokenModel = this._models.VerificationTokenModel;
    const tokenDocument: VerificationTokenDocumnet =
      await VerificationTokenModel.findOne({ token: tokenId });

    if (!tokenDocument) return null;

    const props: IVerificationTokenProps = {
      userId: tokenDocument.userId,
      token: tokenDocument.token,
      createdAt: tokenDocument.createdAt,
    };

    const tokenOrError: Result<VerificationToken> =
      VerificationToken.create(props);
    return tokenOrError.isSuccess ? tokenOrError.getValue() : null;
  }

  public async save(user: User): Promise<UserDocument> {
    const UserModel = this._models.UserModel;
    const userPersistent: UserPersistent = UserMapper.toPersistence(user);

    const userId = new mongoose.Types.ObjectId(user.id.toString());

    const filter = { _id: userId };
    const update = { ...userPersistent };

    const updatedUser: UserDocument = await UserModel.findOneAndUpdate(
      filter,
      update,
      { useFindAndModify: false }
    );

    return updatedUser;
  }

  public async getUserByGoogleId(googleId: string): Promise<UserDocument> {
    const UserModel = this._models.UserModel;
    const filter = { googleId: googleId };
    const user: UserDocument = await UserModel.findOne(filter);
    return user;
  }

  public async getUserByUsername(username: string): Promise<UserDocument> {
    const UserModel = this._models.UserModel;
    const filter = { username: username };
    const user: UserDocument = await UserModel.findOne(filter);
    return user;
  }

  public async removeByUsername(username: string): Promise<void> {
    const UserModel = this._models.UserModel;
    const filter = { username: username };
    await UserModel.deleteOne(filter);
  }
}
