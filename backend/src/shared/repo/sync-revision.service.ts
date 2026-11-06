import mongoose, { type ClientSession } from 'mongoose';
import { ServiceError } from '../core/service-error.js';
import { ServiceErrorLevel } from '../core/service-error-level.enum.js';
import { serviceFail } from '../core/service-fail.factory.js';
import { IDbModels } from '../infra/database/mongodb/index.js';
import { isMongoNamespaceExistsError } from '../infra/database/mongodb/mongo-error.js';
import { noteCommittedRevision } from '../infra/sync-signal/sync-notification.js';
import { ESyncRevisionServiceError } from './sync-revision.service.error.js';

type StampTarget = {
  findOne(filter: { _id: string; userId: string }): {
    session(session: ClientSession): {
      select(fields: '_id'): {
        lean(): Promise<{ _id?: string } | null>;
      };
    };
  };
  updateOne(
    filter: { _id: string; userId: string },
    update: { $set: { syncRevision: number } },
    options: { session: ClientSession },
  ): Promise<{ matchedCount: number }>;
};

const userWriteTail = new Map<string, Promise<void>>();
let counterCollectionReady = false;

mongoose.connection.on('close', () => {
  counterCollectionReady = false;
});

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
      await this.ensureCounterCollection();
      const session = await mongoose.startSession();
      try {
        let committedRevision: number | null = null;
        await session.withTransaction(async () => {
          committedRevision = null;
          const existing = await model
            .findOne({ _id: id, userId })
            .session(session)
            .select('_id')
            .lean();
          if (!existing) {
            return;
          }
          const revision = await this.claim(userId, session);
          const updated = await model.updateOne(
            { _id: id, userId },
            { $set: { syncRevision: revision } },
            { session },
          );
          if (updated.matchedCount !== 1) {
            throw this.abortStamp(
              'sync revision was not stored',
              ESyncRevisionServiceError.RevisionNotStored,
              userId,
            );
          }
          committedRevision = revision;
        });
        if (committedRevision !== null) {
          noteCommittedRevision(userId, committedRevision);
        }
      } finally {
        await session.endSession();
      }
    });
  }

  private async claim(userId: string, session: ClientSession): Promise<number> {
    const counter = await this.models.SyncCounterModel.findOneAndUpdate(
      { _id: userId },
      { $inc: { value: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true, session },
    );
    if (typeof counter?.value !== 'number') {
      throw this.abortStamp(
        'sync counter did not return a revision',
        ESyncRevisionServiceError.CounterMissingValue,
        userId,
      );
    }
    return counter.value;
  }

  private abortStamp(
    message: string,
    code: ESyncRevisionServiceError,
    userId: string,
  ): ServiceError<ESyncRevisionServiceError> {
    return serviceFail(message, code, {
      level: ServiceErrorLevel.High,
      metadata: { userId },
    }).error;
  }

  private async ensureCounterCollection(): Promise<void> {
    if (counterCollectionReady) {
      return;
    }
    try {
      await this.models.SyncCounterModel.createCollection();
    } catch (error) {
      if (!isMongoNamespaceExistsError(error)) {
        throw error;
      }
    }
    counterCollectionReady = true;
  }
}
