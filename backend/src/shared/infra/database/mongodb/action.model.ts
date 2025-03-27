import mongoose, { Document, Schema } from 'mongoose';

export enum EActionType {
  TaskDeleted = 'ACTION_TYPE_TASK_DELETED',
}

export interface IActionPersistent {
  userId: string;
  type: EActionType;
  occurredAt: Date;
  entityId: string;
}

export interface ActionDocument extends IActionPersistent, Document<string> {}

const ActionSchema = new Schema({
  userId: { type: String, require: true },
  type: { type: String, require: true },
  occurredAt: { type: Date, require: true },
  entityId: { type: String, require: true },
});

const ActionModel = mongoose.model<ActionDocument>('Action', ActionSchema);

export default ActionModel;
