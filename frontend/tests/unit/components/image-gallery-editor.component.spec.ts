import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageGalleryEditorComponent } from 'src/app/mobile-app/components/screens/task-screen/task-edit/image-gallery-editor/image-gallery-editor.component';
import type { GalleryImage } from 'src/app/mobile-app/components/screens/task-screen/task-edit/helpers/to-gallery-images.function';

describe('ImageGalleryEditorComponent', () => {
  let fixture: ComponentFixture<ImageGalleryEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageGalleryEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageGalleryEditorComponent);
    fixture.detectChanges();
  });

  it('shows the Images label and add button without a count when nothing is attached', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('[data-test="task-images-section"]')?.textContent).toContain(
      'Images',
    );
    expect(host.querySelector('[data-test="add-image-btn"]')?.textContent).toContain('Add image');
    expect(host.querySelector('[data-test="task-images-count"]')).toBeNull();
    expect(host.querySelector('[data-test="task-image-cover"]')).toBeNull();
  });

  it('shows the count and COVER badge for the cover image', () => {
    const images: GalleryImage[] = [
      { key: 'cover', previewUrl: 'blob:lamp', isCover: true },
      { key: 'second', previewUrl: 'blob:person', isCover: false },
      { key: 'third', previewUrl: 'blob:drawing', isCover: false },
    ];
    fixture.componentRef.setInput('images', images);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const tiles = host.querySelectorAll('[data-test="task-image-tile"]');
    const covers = host.querySelectorAll('[data-test="task-image-cover"]');

    expect(host.querySelector('[data-test="task-images-count"]')?.textContent).toContain(
      '3 images',
    );
    expect(tiles.length).toBe(3);
    expect(covers.length).toBe(1);
    expect(covers[0]?.textContent).toContain('COVER');
    expect(tiles[0]?.textContent).toContain('COVER');
    expect(tiles[1]?.textContent).not.toContain('COVER');
  });

  it('emits the image that was clicked', () => {
    const images: GalleryImage[] = [
      { key: 'cover', previewUrl: 'blob:lamp', isCover: true },
      { key: 'second', previewUrl: 'blob:person', isCover: false },
    ];
    const selected: GalleryImage[] = [];
    fixture.componentInstance.selectCover.subscribe(image => selected.push(image));
    fixture.componentRef.setInput('images', images);
    fixture.detectChanges();

    const tiles = fixture.nativeElement.querySelectorAll('[data-test="task-image-tile"]');
    const selectButtons = fixture.nativeElement.querySelectorAll('[data-test="task-image-select"]');
    (selectButtons[1] as HTMLButtonElement).click();

    expect(selected).toEqual([images[1]]);
    expect(selectButtons[1]?.getAttribute('aria-label')).toBe('Set as cover');
    expect(selectButtons[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(tiles.length).toBe(2);
  });

  it('emits removal from the cross without selecting that image as cover', () => {
    const images: GalleryImage[] = [
      { key: 'cover', previewUrl: 'blob:lamp', isCover: true },
      { key: 'second', previewUrl: 'blob:person', isCover: false },
    ];
    const removed: GalleryImage[] = [];
    const selected: GalleryImage[] = [];
    fixture.componentInstance.removeImage.subscribe(image => removed.push(image));
    fixture.componentInstance.selectCover.subscribe(image => selected.push(image));
    fixture.componentRef.setInput('images', images);
    fixture.detectChanges();

    const removeButtons = fixture.nativeElement.querySelectorAll('[data-test="task-image-remove"]');
    expect(removeButtons.length).toBe(2);
    (removeButtons[0] as HTMLButtonElement).click();

    expect(removed).toEqual([images[0]]);
    expect(selected).toEqual([]);
  });
});
