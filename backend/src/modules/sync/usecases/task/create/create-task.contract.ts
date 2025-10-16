import { TaskDTO, SendChangeContract } from '@brainassistant/contracts';
import { Result } from '../../../../../shared/core/result.js';
import { Task } from '../../../../../shared/domain/models/task.js';
import { CreateTaskError } from './create-task.errors.js';

/**
 * Create Task Use Case Contract
 * 
 * Adapts external API contract (SendChangeContract) for internal backend use.
 * Adds server-side context (userId from auth) to the external contract.
 */

/**
 * Internal use case request - extends external contract with server context
 * 
 * External: SendChangeContract.Request<TaskDTO> - what client sends
 * Internal: CreateTaskRequest - adds userId from authenticated session
 */
export type CreateTaskRequest = {
  userId: string;  // Added by backend from authenticated user
} & SendChangeContract.Request<TaskDTO>;  // External contract: { changeableObjectDto: TaskDTO }

/**
 * Use case result type
 */
export type CreateTaskResult = Result<Task, CreateTaskError>;

