export const USERS_API_CONFIG = {
  baseUrl: '',
  endpoints: {
    list: '/api/users',
  },
} as const;

export type UsersEndpointKey = keyof typeof USERS_API_CONFIG.endpoints;

export const buildUsersUrl = (endpoint: UsersEndpointKey): string => {
  const base = USERS_API_CONFIG.baseUrl?.trim() ?? '';
  const path = USERS_API_CONFIG.endpoints[endpoint];

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
};
