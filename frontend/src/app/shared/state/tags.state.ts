import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { append, iif, insertItem, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { TAG_COLOR, Tag } from 'src/app/shared/models/tag.model';
import { Change } from 'src/app/shared/models/change.model';
import { AppAction } from './app.actions';
import { SyncAction } from './sync.action';
import { TagsAction } from './tags.action';
import { UserState } from './user.state';

interface ITagsStateModel {
  entities: Tag[];
}

@State<ITagsStateModel>({
  name: 'tags',
  defaults: {
    entities: [],
  },
})
@Injectable()
export class TagsState {
  @Selector([TagsState, UserState.userId])
  static forCurrentUser(state: ITagsStateModel, userId: string | null): Tag[] {
    if (!userId) {
      return [];
    }

    return state.entities.filter(tag => tag.userId === userId);
  }

  @Action(TagsAction.CreateTag)
  createTag(
    ctx: StateContext<ITagsStateModel>,
    { tagInitData, userId }: TagsAction.CreateTag,
  ): void {
    try {
      const now = new Date().toISOString();
      const tag: Tag = {
        id: tagInitData.id,
        userId,
        name: tagInitData.name,
        color: TAG_COLOR,
        createdAt: now,
        modifiedAt: now,
      };

      ctx.setState(
        patch({
          entities: append([tag]),
        }),
      );

      ctx.dispatch(
        new SyncAction.ChangeForSyncOccurred({
          entity: EChangedEntity.Tag,
          action: EChangeAction.Created,
          object: tag,
          modifiedAt: now,
        } as Change),
      );
    } catch {
      ctx.dispatch(new AppAction.ShowErrorInUI('Tag creation failed.'));
    }
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
