import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import {
  canonicalTagColor,
  EChangeAction,
  EChangedEntity,
  TagConst,
} from '@brainassistant/contracts';
import { append, iif, insertItem, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { v4 as uuidv4 } from 'uuid';
import { Change, type IChangeableObject } from 'src/app/shared/models/change.model';
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
      color: canonicalTagColor(tagInitData.color) ?? TAG_COLOR,
      isPinned: false,
      createdAt: now,
      modifiedAt: now,
    };
    const entry = this.outboxEntry(tag.id, EChangeAction.Created, tag, now);
    await this.persist(
      ctx,
      entry,
      () => this.localStore.saveTagAndEnqueue(tag, entry),
      () =>
        ctx.setState(
          patch({
            entities: append([tag]),
          }),
        ),
    );
  }

  @Action(TagsAction.UpdateTag)
  async updateTag(
    ctx: StateContext<ITagsStateModel>,
    { tagUpdateData }: TagsAction.UpdateTag,
  ): Promise<void> {
    const current = ctx.getState().entities.find(tag => tag.id === tagUpdateData.tagId);
    const name = tagUpdateData.name.trim();
    const color = canonicalTagColor(tagUpdateData.color);
    if (
      !current ||
      !color ||
      name.length < TagConst.NAME_MIN_LENGTH ||
      name.length > TagConst.NAME_MAX_LENGTH
    ) {
      return;
    }

    const now = new Date().toISOString();
    const tag: Tag = {
      ...current,
      name,
      color,
      modifiedAt: now,
    };
    const entry = this.outboxEntry(tag.id, EChangeAction.Updated, tag, now);
    await this.persist(
      ctx,
      entry,
      () => this.localStore.saveTagAndEnqueue(tag, entry),
      () =>
        ctx.setState(
          patch({
            entities: updateItem(item => item.id === tag.id, patch(tag)),
          }),
        ),
    );
  }

  @Action(TagsAction.DeleteTag)
  async deleteTag(
    ctx: StateContext<ITagsStateModel>,
    { tagId }: TagsAction.DeleteTag,
  ): Promise<void> {
    const current = ctx.getState().entities.find(tag => tag.id === tagId);
    if (!current) {
      return;
    }

    const now = new Date().toISOString();
    const entry = this.outboxEntry(
      tagId,
      EChangeAction.Deleted,
      { id: tagId, modifiedAt: now },
      now,
    );
    await this.persist(
      ctx,
      entry,
      () => this.localStore.deleteTagAndEnqueue(current.userId, tagId, entry),
      () =>
        ctx.setState(
          patch({
            entities: removeItem<Tag>(tag => tag.id === tagId),
          }),
        ),
    );
  }

  @Action(TagsAction.SetPinned)
  async setPinned(
    ctx: StateContext<ITagsStateModel>,
    { tagId, isPinned }: TagsAction.SetPinned,
  ): Promise<void> {
    const current = ctx.getState().entities.find(tag => tag.id === tagId);
    if (!current || (current.isPinned === true) === isPinned) {
      return;
    }

    const now = new Date().toISOString();
    const tag: Tag = {
      ...current,
      isPinned,
      modifiedAt: now,
    };
    const entry = this.outboxEntry(tag.id, EChangeAction.Updated, tag, now);
    await this.persist(
      ctx,
      entry,
      () => this.localStore.saveTagAndEnqueue(tag, entry),
      () =>
        ctx.setState(
          patch({
            entities: updateItem(item => item.id === tag.id, patch(tag)),
          }),
        ),
    );
  }

  private outboxEntry(
    entityId: string,
    action: EChangeAction,
    object: IChangeableObject,
    modifiedAt: string,
  ): OutboxEntry {
    return {
      id: uuidv4(),
      entityId,
      change: {
        entity: EChangedEntity.Tag,
        action,
        object,
        modifiedAt,
      },
    };
  }

  private async persist(
    ctx: StateContext<ITagsStateModel>,
    entry: OutboxEntry,
    write: () => Promise<void>,
    apply: () => void,
  ): Promise<void> {
    try {
      await write();
    } catch {
      ctx.dispatch(new AppAction.ShowErrorInUI(SAVE_FAILED, 'Not saved'));
      return;
    }

    apply();
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
