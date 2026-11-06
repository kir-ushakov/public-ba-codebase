import mongoose, { Document, Schema } from 'mongoose';
import { TaskPresitant } from '../../../domain/models/task.js';

export interface TaskDocument extends Omit<TaskPresitant, '_id'>, Document<string> {}

const TaskSchema = new Schema({
  _id: { type: String, require: true },
  userId: { type: String, require: true },
  type: { type: String, require: true }, // ETaskType wire value
  title: { type: String, require: true },
  status: { type: String, require: true }, // ETaskStatus wire value
  conditions: { type: [String], required: false },
  imageId: { type: String, require: false },
  images: { type: [String], required: false },
  description: { type: Schema.Types.Mixed, require: false },
  audioAttachments: { type: [Schema.Types.Mixed], required: false, default: undefined },
  checklist: {
    type: [
      {
        _id: false,
        id: { type: String, required: true },
        text: { type: String, required: true },
        completed: { type: Boolean, required: true },
      },
    ],
    required: false,
  },
  tagIds: { type: [String], require: false },
  createdAt: { type: Date, require: true },
  modifiedAt: { type: Date, require: true },
  syncRevision: { type: Number, required: false },
});

TaskSchema.index({ userId: 1, syncRevision: 1 });

const TaskModel = mongoose.model<TaskDocument>('Task', TaskSchema);

export default TaskModel;
