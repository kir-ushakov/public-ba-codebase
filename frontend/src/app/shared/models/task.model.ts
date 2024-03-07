/**
 * #NOTE
 * The Task model is a part of the application's business logic
 * because it reflects the main objects that the user and the application
 * will operate.
 * So the 'models' folder is a good place for it.
 *
 * #NOTE
 * In theory it could be represented as a class
  export class TaskClass {
    private _id;
    private _userId;
    private _type;
    // other properties here ...
    get id() {
      return this._id
    }
    get userId() {
        return this._userId
    }
    // other getters/setters here ...

    private constructor(userId: string, props: any) {
      // Build logic...
    }

    public static create(userId: string, props: any): TaskClass {
      // validation
      return new TaskClass(userId, props);
    }

    public update(props: any) {
      // Update logic...
    }

    public validate() {
      // Validate logic...
    }
  }
 */
  export type Task = {
  id: string;
  userId: string;
  type: ETaskType;
  title: string;
  status: ETaskStatus;
  createdAt: Date;
  modifiedAt: Date;
};

/**
 * #NOTE
 * use enumerations instead or all properties that support an enumerable
 * set of values, such as types, states, etc.
 *
 * It helps avoid spelling errors in string constants
 * and gives information about all allowed values for some property.
 *
 * I initialize  all enums with meaningful  string literals that
 * are helpful for dubbed processing.
 *
 * The "E" prefix distinguishes Emum from other classes to improve code readability.
 *
 * I don't use a special folder for enums and store them where their original context exists.
 */
export enum ETaskStatus {
  Todo = 'TASK_STATUS_TODO',
  Done = 'TASK_STATUS_DONE',
  Cancel = 'TASK_STATUS_CANCEL',
}

export enum ETaskType {
  Basic = 'TASK_TYPE_BASIC',
  // TODO: More statuses will be here
}
