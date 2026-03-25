export const AUTH_API_CONFIG = {
  baseUrl: 'https://localhost:7159',
  endpoints: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    users: '/api/auth/users',
    me: '/api/auth/me',
    refresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
  },
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
} as const;

export type AuthEndpointKey = keyof typeof AUTH_API_CONFIG.endpoints;

export const buildAuthUrl = (endpoint: AuthEndpointKey): string => {
  const base = AUTH_API_CONFIG.baseUrl?.trim() ?? '';
  const path = AUTH_API_CONFIG.endpoints[endpoint];

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
};
