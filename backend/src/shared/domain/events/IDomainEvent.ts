import { UniqueEntityID } from '../UniqueEntityID.js';

export interface IDomainEvent {
  dateTimeOccurred: Date;
  getAggregateId(): UniqueEntityID;
}
