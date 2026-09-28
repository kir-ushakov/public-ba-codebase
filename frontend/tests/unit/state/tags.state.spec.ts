import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { firstValueFrom } from 'rxjs';
import { TAG_COLOR } from 'src/app/shared/models/tag.model';
import { AuthService } from 'src/app/shared/services/api/auth.service';
import { GoogleOAuthConsentService } from 'src/app/shared/services/integrations/google-oauth-consent.service';
import { SlackService } from 'src/app/shared/services/integrations/slack.service';
import { SyncAction } from 'src/app/shared/state/sync.action';
import { TagsAction } from 'src/app/shared/state/tags.action';
import { TagsState } from 'src/app/shared/state/tags.state';
import { EUserAuthState, UserState } from 'src/app/shared/state/user.state';

describe('TagsState', () => {
  let store: Store;
  const userId = 'user-1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideStore([TagsState, UserState]),
        { provide: AuthService, useValue: {} },
        { provide: SlackService, useValue: {} },
        { provide: GoogleOAuthConsentService, useValue: {} },
      ],
    });

    store = TestBed.inject(Store);
    store.reset({
      tags: { entities: [] },
      user: {
        userData: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          userId,
          googleId: 'g-1',
        },
        authState: EUserAuthState.Authenticated,
        authType: undefined,
        integrations: { isAddedToSlack: undefined },
      },
    });
  });

  it('creates a tag optimistically for the signed-in user', async () => {
    await firstValueFrom(
      store.dispatch(new TagsAction.CreateTag({ id: 'tag-1', name: 'Errands' }, userId)),
    );

    expect(store.selectSnapshot(TagsState.forCurrentUser)).toEqual([
      expect.objectContaining({
        id: 'tag-1',
        userId,
        name: 'Errands',
        color: TAG_COLOR,
      }),
    ]);
  });

  it('merges a tag loaded from the server and removes it on delete', async () => {
    await firstValueFrom(
      store.dispatch(
        new SyncAction.ServerChangesLoaded([
          {
            entity: EChangedEntity.Tag,
            action: EChangeAction.Updated,
            object: {
              id: 'tag-server',
              userId,
              name: 'Server tag',
              color: TAG_COLOR,
              createdAt: '2024-01-01T00:00:00.000Z',
              modifiedAt: '2024-01-02T00:00:00.000Z',
            },
          },
        ]),
      ),
    );

    expect(store.selectSnapshot(TagsState.forCurrentUser).map(tag => tag.name)).toEqual([
      'Server tag',
    ]);

    await firstValueFrom(
      store.dispatch(
        new SyncAction.ServerChangesLoaded([
          {
            entity: EChangedEntity.Tag,
            action: EChangeAction.Deleted,
            object: { id: 'tag-server', modifiedAt: '2024-01-03T00:00:00.000Z' },
          },
        ]),
      ),
    );

    expect(store.selectSnapshot(TagsState.forCurrentUser)).toEqual([]);
  });
});
