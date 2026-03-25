import { AUTH_API_CONFIG, buildAuthUrl, type AuthEndpointKey } from '../config/authApiConfig';

export type UserRole = 'Admin' | 'Manager' | 'Examiner';

export interface AuthUser {
  id: string | number;
  email: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface AuthTokenResponse {
  token?: string;
  accessToken?: string;
  jwtToken?: string;
  refreshToken?: string;
  user?: AuthUser;
}

export interface RefreshTokenResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}

type RequestOptions = {
  method: 'GET' | 'POST';
  endpoint: AuthEndpointKey;
  body?: unknown;
  token?: string;
};

const request = async <T>({ method, endpoint, body, token }: RequestOptions): Promise<T> => {
  const hasBody = body !== undefined;

  const response = await fetch(buildAuthUrl(endpoint), {
    method,
    credentials: 'include',
    headers: {
      ...(hasBody ? AUTH_API_CONFIG.defaultHeaders : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      if (typeof errorData?.message === 'string') {
        message = errorData.message;
      }
    } catch {
      // Ignore parsing error and keep fallback message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
};

export const authService = {
  register: (payload: RegisterRequest) =>
    request<AuthTokenResponse>({ method: 'POST', endpoint: 'register', body: payload }),

  login: (payload: LoginRequest) =>
    request<AuthTokenResponse>({ method: 'POST', endpoint: 'login', body: payload }),

  createUser: (payload: CreateUserRequest, token: string) =>
    request<AuthUser>({ method: 'POST', endpoint: 'users', body: payload, token }),

  getMe: (token: string) => request<AuthUser>({ method: 'GET', endpoint: 'me', token }),

  refresh: () => request<RefreshTokenResponse>({ method: 'POST', endpoint: 'refresh' }),

  logout: (token?: string) => request<void>({ method: 'POST', endpoint: 'logout', token }),
};
