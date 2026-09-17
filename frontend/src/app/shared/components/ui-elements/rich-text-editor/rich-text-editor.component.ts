import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Editor } from '@tiptap/core';
import type { TaskDescriptionDoc } from '@brainassistant/contracts';
import { createTaskDescriptionExtensions } from './helpers/create-task-description-extensions.function';
import { EMPTY_TASK_DESCRIPTION } from './helpers/empty-task-description.const';

@Component({
  selector: 'ba-rich-text-editor',
  imports: [MatIconModule],
  templateUrl: './rich-text-editor.component.html',
  styleUrl: './rich-text-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
})
export class RichTextEditorComponent implements ControlValueAccessor, OnDestroy {
  readonly readonly = input(false);
  readonly content = input<TaskDescriptionDoc | null>(null);

  readonly isBold = signal(false);
  readonly isItalic = signal(false);
  readonly isBulletList = signal(false);
  readonly isOrderedList = signal(false);
  readonly isLink = signal(false);

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('editorHost');
  private editor: Editor | null = null;
  private pendingContent: TaskDescriptionDoc | null = null;
  private disabled = false;

  constructor() {
    afterNextRender(() => {
      this.createEditor();
    });

    effect(() => {
      const doc = this.content();
      if (this.readonly()) {
        this.setEditorContent(doc);
      }
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }

  writeValue(value: TaskDescriptionDoc | null): void {
    this.pendingContent = value;
    this.setEditorContent(value);
  }

  registerOnChange(fn: (value: TaskDescriptionDoc | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.editor?.setEditable(!this.readonly() && !isDisabled);
  }

  toggleBold(): void {
    this.editor?.chain().focus().toggleBold().run();
  }

  toggleItalic(): void {
    this.editor?.chain().focus().toggleItalic().run();
  }

  toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList(): void {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  toggleLink(): void {
    if (!this.editor) {
      return;
    }

    if (this.editor.isActive('link')) {
      this.editor.chain().focus().unsetLink().run();
      return;
    }

    const previous = this.editor.getAttributes('link')['href'];
    // Native prompt is enough for v1 URL entry; a custom dialog can replace this later.
    // eslint-disable-next-line no-alert
    const href = window.prompt('Link URL', typeof previous === 'string' ? previous : 'https://');
    if (href === null) {
      return;
    }

    const trimmed = href.trim();
    if (trimmed === '') {
      this.editor.chain().focus().unsetLink().run();
      return;
    }

    this.editor.chain().focus().setLink({ href: trimmed }).run();
  }

  private onChange: (value: TaskDescriptionDoc | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  private createEditor(): void {
    const readonly = this.readonly();
    const initialContent = this.pendingContent ?? this.content() ?? EMPTY_TASK_DESCRIPTION;

    this.editor = new Editor({
      element: this.host().nativeElement,
      extensions: createTaskDescriptionExtensions(readonly),
      content: initialContent,
      editable: !readonly && !this.disabled,
      editorProps: {
        attributes: {
          'data-test': 'task-description-content',
        },
      },
      onUpdate: ({ editor }) => {
        if (readonly) {
          return;
        }
        this.onChange(editor.getJSON() as TaskDescriptionDoc);
      },
      onSelectionUpdate: () => {
        this.syncToolbarState();
      },
      onTransaction: () => {
        this.syncToolbarState();
      },
      onBlur: () => {
        this.onTouched();
      },
    });

    this.syncToolbarState();
  }

  private setEditorContent(value: TaskDescriptionDoc | null): void {
    if (!this.editor) {
      return;
    }

    const next = value ?? EMPTY_TASK_DESCRIPTION;
    if (JSON.stringify(this.editor.getJSON()) === JSON.stringify(next)) {
      return;
    }

    this.editor.commands.setContent(next, { emitUpdate: false });
  }

  private syncToolbarState(): void {
    const editor = this.editor;
    if (!editor) {
      return;
    }

    this.isBold.set(editor.isActive('bold'));
    this.isItalic.set(editor.isActive('italic'));
    this.isBulletList.set(editor.isActive('bulletList'));
    this.isOrderedList.set(editor.isActive('orderedList'));
    this.isLink.set(editor.isActive('link'));
  }
}
