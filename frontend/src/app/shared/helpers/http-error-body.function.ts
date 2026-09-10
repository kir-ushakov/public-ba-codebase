import { HttpErrorResponse } from '@angular/common/http';

export function readApiErrorName(error: HttpErrorResponse): string | undefined {
  return readApiErrorNameFromBody(error.error);
}

function readApiErrorNameFromBody(body: unknown): string | undefined {
  if (typeof body === 'string') {
    return readApiErrorNameFromBody(parseJsonObject(body));
  }
  if (body === null || body === undefined || typeof body !== 'object' || Array.isArray(body)) {
    return undefined;
  }
  if (isBlobLike(body) || body instanceof ArrayBuffer) {
    return undefined;
  }
  const payload = body as { name?: unknown; code?: unknown };
  if (typeof payload.name === 'string') {
    return payload.name;
  }
  if (typeof payload.code === 'string') {
    return payload.code;
  }
  return undefined;
}

/**
 * HttpClient leaves JSON error bodies as a Blob when the request used
 * `responseType: 'blob'` (image GET). Parse those back to an object so
 * callers can read `name` / `code`.
 */
export async function normalizeHttpErrorResponse(
  error: HttpErrorResponse,
): Promise<HttpErrorResponse> {
  const body = error.error;
  if (typeof body === 'string') {
    const parsed = parseJsonObject(body);
    return parsed === undefined ? error : cloneHttpError(error, parsed);
  }
  if (isBlobLike(body)) {
    try {
      const parsed = parseJsonObject(await blobToText(body));
      return parsed === undefined ? error : cloneHttpError(error, parsed);
    } catch {
      return error;
    }
  }
  return error;
}

function isBlobLike(body: unknown): body is Blob {
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return true;
  }
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as { size?: unknown }).size === 'number' &&
    typeof (body as { arrayBuffer?: unknown }).arrayBuffer === 'function'
  );
}

async function blobToText(body: Blob): Promise<string> {
  if (typeof body.text === 'function') {
    return body.text();
  }
  if (typeof Response !== 'undefined') {
    return await new Response(body).text();
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsText(body);
  });
}

function parseJsonObject(text: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function cloneHttpError(error: HttpErrorResponse, body: unknown): HttpErrorResponse {
  return new HttpErrorResponse({
    error: body,
    headers: error.headers,
    status: error.status,
    statusText: error.statusText,
    url: error.url ?? undefined,
  });
}
