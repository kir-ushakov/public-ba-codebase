function httpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  if ('status' in error && typeof error.status === 'number') {
    return error.status;
  }
  if (
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    typeof error.response.status === 'number'
  ) {
    return error.response.status;
  }
  return undefined;
}

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
      const status = httpStatus(error);
      if (status !== undefined && status !== 429 && status < 500) throw error; // non-retriable
      const waitTime = delayMs * Math.pow(backoffFactor, attempt);
      await new Promise(r => setTimeout(r, waitTime));
      attempt++;
    }
  }
  throw lastError;
}
