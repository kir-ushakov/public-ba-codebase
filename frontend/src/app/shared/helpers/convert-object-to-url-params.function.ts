export function convertObjectToUrlParams(
  payloadObject: Record<string, string | number | boolean | null | undefined>,
): string {
  const payload = new URLSearchParams();
  for (const key in payloadObject) {
    payload.set(key, String(payloadObject[key]));
  }

  return payload.toString();
}
