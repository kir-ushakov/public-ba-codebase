export function formatAttachedImageCount(count: number): string | null {
  if (count < 1) {
    return null;
  }

  return count === 1 ? '1 image' : `${count} images`;
}
