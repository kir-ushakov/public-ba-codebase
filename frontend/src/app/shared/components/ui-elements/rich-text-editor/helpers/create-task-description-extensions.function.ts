import type { Extensions } from '@tiptap/core';
import { Placeholder } from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';

export function createTaskDescriptionExtensions(readonly: boolean): Extensions {
  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      blockquote: false,
      code: false,
      horizontalRule: false,
      underline: false,
      trailingNode: false,
      link: {
        openOnClick: readonly,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['https', 'http', 'mailto'],
      },
    }),
    ...(readonly
      ? []
      : [
          Placeholder.configure({
            placeholder: 'Write additional details about this task...',
          }),
        ]),
  ];
}
