import { AUTH_API_CONFIG } from '../config/authApiConfig';
import { getAccessToken } from './tokenProvider';
import { httpClearSession, httpNavigate } from './httpHandlers';
import { markPendingHttp401Redirect } from './httpAuthRedirect';

export function resolveApiUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const base = AUTH_API_CONFIG.baseUrl?.trim().replace(/\/$/, '') ?? '';
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;

  if (!base) {
    return path;
  }

  return `${base}${path}`;
}

export class HttpRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpRequestError';
    this.status = status;
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  let message = `Request failed with status ${response.status}`;

  try {
    const errorData = (await response.json()) as Record<string, unknown>;
    if (typeof errorData.message === 'string') {
      message = errorData.message;
    } else if (typeof errorData.detail === 'string') {
      message = errorData.detail;
    } else if (typeof errorData.title === 'string') {
      message = errorData.title;
    } else if (errorData.errors && typeof errorData.errors === 'object') {
      const first = Object.values(errorData.errors as Record<string, unknown>)[0];
      if (Array.isArray(first) && typeof first[0] === 'string') {
        message = first[0];
      }
    }
  } catch {
    // giữ message mặc định
  }

  return message;
}

export type RequestJsonOptions = {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /**
   * true: gắn Bearer từ tokenProvider (mặc định).
   * false: login/register/refresh không kèm token.
   */
  withAuth?: boolean;
  /** Ưu tiên hơn tokenProvider (ví dụ vừa login, chưa kịp sync store). */
  accessToken?: string | null;
  headers?: Record<string, string>;
};

/**
 * Fetch JSON tập trung: JWT Bearer (khi withAuth), credentials omit, xử lý lỗi ProblemDetails.
 * Dùng cho mọi API sau này: `requestJson({ url: '/api/...', method: 'GET' })`.
 */
export async function requestJson<T>(options: RequestJsonOptions): Promise<T> {
  const {
    url,
    method = 'GET',
    body,
    withAuth = true,
    accessToken: accessTokenOverride,
    headers: extraHeaders = {},
  } = options;

  const hasJsonBody = body !== undefined && method !== 'GET';

  const headers: Record<string, string> = {
    ...extraHeaders,
    ...(hasJsonBody ? { ...AUTH_API_CONFIG.defaultHeaders } : {}),
  };

  const token =
    accessTokenOverride !== undefined ? accessTokenOverride : withAuth ? getAccessToken() : null;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(resolveApiUrl(url), {
    method,
    credentials: 'omit',
    headers,
    body: hasJsonBody ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await parseErrorMessage(response);

    if (response.status === 401 && withAuth) {
      markPendingHttp401Redirect();
      httpClearSession();
      httpNavigate('/unauthorized');
    } else if (response.status === 403 && withAuth) {
      httpNavigate('/forbidden');
    }

    throw new HttpRequestError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}
