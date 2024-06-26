import mongoose, {
  PassportLocalDocument,
  PassportLocalModel,
  Schema,
} from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
import { UserPersistent } from '../../../domain/models/user';
import VerificationTokenModel, {
  VerificationTokenDocumnet,
} from './verification-token.model';

const crypto = require('crypto');

export interface UserDocument extends UserPersistent, PassportLocalDocument {
  generateVerificationToken: () => VerificationTokenDocumnet;
}

const UserSchema = new Schema({
  firstName: { type: String, require: true },
  lastName: { type: String, require: true },
  username: { type: String, require: true },
  verified: { type: Boolean, required: true, default: false },
  googleId: { type: String, required: false },
});

/**
 * Attach passportLocalMongoose plugin functionality to UserScheme
 * with methods:
 * createStrategy(), serializeUser(), deserializeUser() and others...
 **/
UserSchema.plugin(passportLocalMongoose);

UserSchema.methods.generateVerificationToken = function () {
  let payload = {
    userId: this._id,
    token: crypto.randomBytes(20).toString('hex'),
  };

  return new VerificationTokenModel(payload);
};

const UserModel: PassportLocalModel<UserDocument> =
  mongoose.model<UserDocument>('User', UserSchema);

export default UserModel;
