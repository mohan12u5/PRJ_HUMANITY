export const CSRF_HEADER_NAME = 'x-humanity-client';
export const CSRF_HEADER_VALUE = '1';

export function withJsonHeaders(extra?: HeadersInit): HeadersInit {
  return {
    'Content-Type': 'application/json',
    [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE,
    ...extra
  };
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isMutating = method !== 'GET' && method !== 'HEAD';

  const headers: HeadersInit = isMutating
    ? withJsonHeaders(options.headers)
    : { ...(options.headers || {}) };

  return fetch(url, {
    ...options,
    headers
  });
}
