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
});
