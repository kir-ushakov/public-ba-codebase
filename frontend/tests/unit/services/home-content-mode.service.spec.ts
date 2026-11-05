import { HomeContentModeService } from 'src/app/mobile-app/components/screens/home-screen/home-content-mode.service';

describe('HomeContentModeService tag filter', () => {
  let service: HomeContentModeService;

  beforeEach(() => {
    service = new HomeContentModeService();
  });

  it('toggles one tag and keeps it when the category changes', () => {
    service.toggleTag('work');
    service.select('todo');

    expect(service.selectedTagId()).toBe('work');
    expect(service.mode()).toBe('todo');

    service.toggleTag('work');
    expect(service.selectedTagId()).toBeNull();
  });

  it('clears the filter when the signed-in user changes and keeps it for the same user', () => {
    service.showTag('work');
    service.bindUser('user-1');
    expect(service.selectedTagId()).toBeNull();

    service.showTag('work');
    service.bindUser('user-1');
    expect(service.selectedTagId()).toBe('work');

    service.bindUser('user-2');
    expect(service.selectedTagId()).toBeNull();
  });

  it('clears a pinned filter when that tag is unpinned and keeps an unpinned one', () => {
    service.notePinned(['work']);
    service.showTag('work');
    service.notePinned([]);
    expect(service.selectedTagId()).toBeNull();

    service.notePinned(['work']);
    service.showTag('ideas');
    service.notePinned([]);
    expect(service.selectedTagId()).toBe('ideas');
  });

  it('clears the filter when the selected tag is gone', () => {
    service.showTag('work');
    service.noteTags(['ideas']);
    expect(service.selectedTagId()).toBeNull();

    service.showTag('work');
    service.clearTag('ideas');
    expect(service.selectedTagId()).toBe('work');
    service.clearTag('work');
    expect(service.selectedTagId()).toBeNull();
  });
});
