import mongoose, { Document, Schema } from 'mongoose';
import { TaskPresitant } from '../../../domain/models/task.js';

export interface TaskDocument
  extends Omit<TaskPresitant, '_id'>,
    Document<string> {}

const TaskSchema = new Schema({
  _id: { type: String, require: true },
  userId: { type: String, require: true },
  type: { type: String, require: true }, // ETaskType wire value
  title: { type: String, require: true },
  status: { type: String, require: true }, // ETaskStatus wire value
  imageId: { type: String, require: false },
  createdAt: { type: Date, require: true },
  modifiedAt: { type: Date, require: true },
});

const TaskModel = mongoose.model<TaskDocument>('Task', TaskSchema);

export default TaskModel;
