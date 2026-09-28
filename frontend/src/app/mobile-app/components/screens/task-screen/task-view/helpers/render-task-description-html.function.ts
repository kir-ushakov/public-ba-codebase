import type {
  TaskDescriptionDoc,
  TaskDescriptionMark,
  TaskDescriptionNode,
} from '@brainassistant/contracts';

export function renderTaskDescriptionHtml(doc: TaskDescriptionDoc): string {
  return (doc.content ?? []).map(node => renderNode(node)).join('');
}

function renderNode(node: TaskDescriptionNode): string {
  switch (node.type) {
    case 'paragraph':
      return `<p>${renderChildren(node)}</p>`;
    case 'bulletList':
      return `<ul>${renderChildren(node)}</ul>`;
    case 'orderedList':
      return `<ol>${renderChildren(node)}</ol>`;
    case 'listItem':
      return `<li>${renderChildren(node)}</li>`;
    case 'hardBreak':
      return '<br>';
    case 'text':
      return applyMarks(escapeHtml(node.text ?? ''), node.marks);
    default:
      return renderChildren(node);
  }
}

function renderChildren(node: TaskDescriptionNode): string {
  return (node.content ?? []).map(child => renderNode(child)).join('');
}

function applyMarks(text: string, marks: TaskDescriptionMark[] | undefined): string {
  return (marks ?? []).reduce((html, mark) => wrapMark(html, mark), text);
}

function wrapMark(html: string, mark: TaskDescriptionMark): string {
  switch (mark.type) {
    case 'bold':
      return `<strong>${html}</strong>`;
    case 'italic':
      return `<em>${html}</em>`;
    case 'strike':
      return `<s>${html}</s>`;
    case 'link':
      return wrapLink(html, mark.attrs?.href);
    default:
      return html;
  }
}

function wrapLink(html: string, href: string | undefined): string {
  if (href === undefined || !isSafeHref(href)) {
    return html;
  }

  return `<a href="${escapeHtml(href.trim())}">${html}</a>`;
}

function isSafeHref(href: string): boolean {
  const value = href.trim().toLowerCase();
  return value.startsWith('https://') || value.startsWith('http://') || value.startsWith('mailto:');
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
