export async function retry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 1000,
  backoffFactor = 2,
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error?.status || error?.response?.status;
      if (status !== 429 && status < 500) throw error; // non-retriable
      const waitTime = delayMs * Math.pow(backoffFactor, attempt);
      await new Promise(r => setTimeout(r, waitTime));
      attempt++;
    }
  }
  throw lastError;
}
