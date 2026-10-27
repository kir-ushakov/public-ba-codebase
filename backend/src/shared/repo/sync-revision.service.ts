import { IDbModels } from '../infra/database/mongodb/index.js';

type StampTarget = {
  findOne(filter: { _id: string; userId: string }): {
    select(fields: '_id'): {
      lean(): Promise<{ _id?: string } | null>;
    };
  };
  updateOne(
    filter: { _id: string; userId: string },
    update: { $set: { syncRevision: number } },
  ): Promise<unknown>;
};

const userWriteTail = new Map<string, Promise<void>>();

function withUserWriteLock<T>(userId: string, work: () => Promise<T>): Promise<T> {
  const previous = userWriteTail.get(userId) ?? Promise.resolve();
  const run = previous.then(work, work);
  const tail = run.then(
    () => undefined,
    () => undefined,
  );
  userWriteTail.set(userId, tail);
  void tail.finally(() => {
    if (userWriteTail.get(userId) === tail) {
      userWriteTail.delete(userId);
    }
  });
  return run;
}

export class SyncRevisionService {
  constructor(private readonly models: IDbModels) {}

  public async numberMissing(userId: string): Promise<void> {
    const tasks = await this.models.TaskModel.find({ userId, syncRevision: { $exists: false } })
      .sort({ modifiedAt: 1 })
      .select('_id')
      .lean();
    for (const task of tasks) {
      await this.stamp(this.models.TaskModel, userId, String(task._id));
    }

    const tags = await this.models.TagModel.find({ userId, syncRevision: { $exists: false } })
      .sort({ modifiedAt: 1 })
      .select('_id')
      .lean();
    for (const tag of tags) {
      await this.stamp(this.models.TagModel, userId, String(tag._id));
    }

    const actions = await this.models.ActionModel.find({
      userId,
      syncRevision: { $exists: false },
    })
      .sort({ occurredAt: 1 })
      .select('_id')
      .lean();
    for (const action of actions) {
      await this.stamp(this.models.ActionModel, userId, String(action._id));
    }
  }

  public async stampTask(userId: string, taskId: string): Promise<void> {
    await this.stamp(this.models.TaskModel, userId, taskId);
  }

  public async stampTag(userId: string, tagId: string): Promise<void> {
    await this.stamp(this.models.TagModel, userId, tagId);
  }

  public async stampAction(userId: string, actionId: string): Promise<void> {
    await this.stamp(this.models.ActionModel, userId, actionId);
  }

  private async stamp(model: StampTarget, userId: string, id: string): Promise<void> {
    await withUserWriteLock(userId, async () => {
      const existing = await model.findOne({ _id: id, userId }).select('_id').lean();
      if (!existing) {
        return;
      }
      const revision = await this.claim(userId);
      await model.updateOne({ _id: id, userId }, { $set: { syncRevision: revision } });
    });
  }

  private async claim(userId: string): Promise<number> {
    const counter = await this.models.SyncCounterModel.findOneAndUpdate(
      { _id: userId },
      { $inc: { value: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return counter.value;
  }
}
