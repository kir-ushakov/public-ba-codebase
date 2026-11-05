import { HomeContentModeService } from 'src/app/mobile-app/components/screens/home-screen/home-content-mode.service';

describe('HomeContentModeService tag filter', () => {
  let service: HomeContentModeService;

  beforeEach(() => {
    service = new HomeContentModeService();
  });

  it('toggles one tag and keeps it when the category changes', () => {
    service.toggleTag('work');
    service.select('todo');

    expect(service.selectedTagIds()).toEqual(['work']);
    expect(service.mode()).toBe('todo');

    service.toggleTag('ideas');
    expect(service.selectedTagIds()).toEqual(['work', 'ideas']);

    service.toggleTag('work');
    expect(service.selectedTagIds()).toEqual(['ideas']);
  });

  it('clears the filter when the signed-in user changes and keeps it for the same user', () => {
    service.showTag('work');
    service.bindUser('user-1');
    expect(service.selectedTagIds()).toEqual([]);

    service.showTag('work');
    service.bindUser('user-1');
    expect(service.selectedTagIds()).toEqual(['work']);

    service.bindUser('user-2');
    expect(service.selectedTagIds()).toEqual([]);
  });

  it('clears the filter when the selected tag is gone', () => {
    service.toggleTag('work');
    service.toggleTag('ideas');
    service.noteTags(['ideas']);
    expect(service.selectedTagIds()).toEqual(['ideas']);

    service.clearTag('ideas');
    expect(service.selectedTagIds()).toEqual([]);
  });
});
