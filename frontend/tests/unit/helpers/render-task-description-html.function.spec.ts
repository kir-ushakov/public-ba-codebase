import { renderTaskDescriptionHtml } from 'src/app/mobile-app/components/screens/task-screen/task-view/helpers/render-task-description-html.function';

describe('renderTaskDescriptionHtml', () => {
  it('renders paragraphs and bold text', () => {
    const html = renderTaskDescriptionHtml({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Remember to buy the usual dry food.' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'salmon variant',
              marks: [{ type: 'bold' }],
            },
          ],
        },
      ],
    });

    expect(html).toBe(
      '<p>Remember to buy the usual dry food.</p><p><strong>salmon variant</strong></p>',
    );
  });

  it('escapes text and drops unsafe links', () => {
    const html = renderTaskDescriptionHtml({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '<script>',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    });

    expect(html).toBe('<p>&lt;script&gt;</p>');
  });

  it('keeps an https link', () => {
    const html = renderTaskDescriptionHtml({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'supplier',
              marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
            },
          ],
        },
      ],
    });

    expect(html).toBe('<p><a href="https://example.com">supplier</a></p>');
  });
});
