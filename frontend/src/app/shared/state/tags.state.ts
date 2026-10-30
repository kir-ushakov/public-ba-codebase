import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { append, iif, insertItem, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { v4 as uuidv4 } from 'uuid';
import { Change } from 'src/app/shared/models/change.model';
import { TAG_COLOR, Tag } from 'src/app/shared/models/tag.model';
import { OutboxEntry } from '../models/outbox-entry.type';
import { LocalStore } from '../services/infrastructure/local-store.service';
import { AppAction } from './app.actions';
import { SyncAction } from './sync.action';
import { TagsAction } from './tags.action';
import { UserAction } from './user.actions';
import { UserState } from './user.state';

interface ITagsStateModel {
  entities: Tag[];
}

const SAVE_FAILED = 'Could not save the tag on this device.';

@State<ITagsStateModel>({
  name: 'tags',
  defaults: {
    entities: [],
  },
})
@Injectable()
export class TagsState {
  constructor(private readonly localStore: LocalStore) {}

  @Selector([TagsState, UserState.userId])
  static forCurrentUser(state: ITagsStateModel, userId: string | null): Tag[] {
    if (!userId) {
      return [];
    }

    return state.entities.filter(tag => tag.userId === userId);
  }

  @Action(TagsAction.CreateTag)
  async createTag(
    ctx: StateContext<ITagsStateModel>,
    { tagInitData, userId }: TagsAction.CreateTag,
  ): Promise<void> {
    const now = new Date().toISOString();
    const tag: Tag = {
      id: tagInitData.id,
      userId,
      name: tagInitData.name,
      color: TAG_COLOR,
      createdAt: now,
      modifiedAt: now,
    };
    const entry: OutboxEntry = {
      id: uuidv4(),
      entityId: tag.id,
      change: {
        entity: EChangedEntity.Tag,
        action: EChangeAction.Created,
        object: tag,
        modifiedAt: now,
      },
    };

    try {
      await this.localStore.saveTagAndEnqueue(tag, entry);
    } catch {
      ctx.dispatch(new AppAction.ShowErrorInUI(SAVE_FAILED, 'Not saved'));
      return;
    }

    ctx.setState(
      patch({
        entities: append([tag]),
      }),
    );
    ctx.dispatch(new AppAction.ClearErrorInUI());
    ctx.dispatch(new SyncAction.ChangeForSyncOccurred(entry));
  }

  @Action(UserAction.LoggedOut)
  loggedOut(ctx: StateContext<ITagsStateModel>): void {
    ctx.setState({ entities: [] });
  }

  @Action(SyncAction.LocalDataHydrated)
  hydrate(ctx: StateContext<ITagsStateModel>, { snapshot }: SyncAction.LocalDataHydrated): void {
    ctx.setState({ entities: snapshot.tags });
  }

  @Action(SyncAction.ServerChangesLoaded)
  synchronize(ctx: StateContext<ITagsStateModel>, { changes }: { changes: Change[] }): void {
    const tagChanges = changes.filter(change => change.entity === EChangedEntity.Tag);
    for (const tagChange of tagChanges) {
      const changedObject = tagChange.object;
      if (!changedObject) {
        continue;
      }
      if (tagChange.action === EChangeAction.Deleted) {
        ctx.setState(
          patch({
            entities: removeItem<Tag>(tag => tag.id === changedObject.id),
          }),
        );
        continue;
      }

      const tag = changedObject as Tag;
      ctx.setState(
        patch({
          entities: iif<Tag[]>(
            tags => tags.some(item => item.id === tag.id),
            updateItem(item => item.id === tag.id, patch(tag)),
            insertItem(tag),
          ),
        }),
      );
    }
  }
}
