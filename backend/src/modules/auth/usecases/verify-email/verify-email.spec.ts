import express from 'express';
import mongoose from 'mongoose';
import { it, describe } from 'mocha';
import chai from 'chai';
import sinon, { SinonSpy } from 'sinon';
const expect = chai.expect;

import { models } from '../../../../shared/infra/database/mongodb/index';
import { VerifyEmailUseCase } from './verify-email.usecase';
import { UserRepo } from '../../../../shared/repo/user.repo';
import {
  VerifyEmailRequestDTO,
  IVerifyEmailResponceDTO,
} from './verify-email.dto';
import { VerificationToken } from '../../../../shared/domain/values/user/verification-token';
import { User } from '../../../../shared/domain/models/user';
import { Result } from '../../../../shared/core/Result';
import { UseCaseError } from '../../../../shared/core/use-case-error';

describe('VerifyEmailUseCase', () => {
  let userRepo: UserRepo;
  let verifyEmail: VerifyEmailUseCase;

  beforeEach(() => {
    userRepo = new UserRepo(models);
    verifyEmail = new VerifyEmailUseCase(userRepo);
  });

  describe('#execute()', async () => {
    const tockenIdStub = 'VERIFICATION_TOKEN';
    const dto: VerifyEmailRequestDTO = {
      token: tockenIdStub,
    };
    const userIDStub = new mongoose.Types.ObjectId('5e6a9e5ec6e44398ae2ac16a');
    const tokenStub: VerificationToken = {
      userId: userIDStub,
    } as VerificationToken;
    const user: User = {
      username: { value: 'user@email.com' },
      firstname: 'First Name',
      lastname: 'Last Name',
      verified: true,
      verify: () => {
        return Result.ok();
      },
    } as User;

    it('should verify email with ticket', async () => {
      const getTokenByTokenIdStub = sinon
        .stub(userRepo, 'getTokenByTokenId')
        .resolves(tokenStub);
      const findUserByIdStub = sinon
        .stub(userRepo, 'findUserById')
        .resolves(user);
      const userVerifySpy = sinon.spy(user, 'verify');
      const saveUserStub = sinon.stub(userRepo, 'save');

      const result: Result<IVerifyEmailResponceDTO | UseCaseError> =
        await verifyEmail.execute(dto);

      expect(getTokenByTokenIdStub.calledWith(tockenIdStub));
      expect(findUserByIdStub.calledWith(userIDStub));
      expect(userVerifySpy.calledOnce).to.be.true;
      expect(saveUserStub.calledOnce).to.be.true;
      expect(result.isSuccess).to.be.true;
      const expectedResultValue = {
        email: user.username.value,
        firstName: user.firstname,
        lastName: user.lastname,
        verified: user.verified,
      };
      console.log('result.getValue()');
      console.log(result.getValue());
      const value = result.getValue();
      expect(value).to.deep.equal(expectedResultValue);
    });
  });

  describe('VerifyEmailController', () => {
    describe('#executeImpl()', () => {
      // TODO Impleament test the same way as signup.spec.ts -> SignupController/#executeImpl()
    });
  });
});
