import mongoose from 'mongoose';
import { Identifier } from './Identifier.js';

export class UniqueEntityID extends Identifier<string | number> {
  constructor(id?: string | number) {
    super(id ? id : new mongoose.Types.ObjectId().toHexString());
  }
}
