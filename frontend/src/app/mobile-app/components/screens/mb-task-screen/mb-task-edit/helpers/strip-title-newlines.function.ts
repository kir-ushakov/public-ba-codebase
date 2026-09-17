export function stripTitleNewlines(value: string): string {
  return value.replace(/[\r\n]+/g, ' ');
}
