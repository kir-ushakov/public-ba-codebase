export function convertObjectToUrlParams(payloadObject): string {
  const payload = new URLSearchParams();
  for (const key in payloadObject) {
    payload.set(key, payloadObject[key]);
  }

  return payload.toString();
}
