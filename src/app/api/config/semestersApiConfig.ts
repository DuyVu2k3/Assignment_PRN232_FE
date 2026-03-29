export const SEMESTERS_API_CONFIG = {
  baseUrl: '',
  endpoints: {
    list: '/api/semesters',
    create: '/api/semesters',
    detail: '/api/semesters/{id}',
    update: '/api/semesters/{id}',
    remove: '/api/semesters/{id}',
  },
} as const;

export type SemestersEndpointKey = keyof typeof SEMESTERS_API_CONFIG.endpoints;

export const buildSemestersUrl = (endpoint: SemestersEndpointKey): string => {
  const base = SEMESTERS_API_CONFIG.baseUrl?.trim() ?? '';
  const path = SEMESTERS_API_CONFIG.endpoints[endpoint];

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
};

export const buildSemesterByIdUrl = (
  endpoint: 'detail' | 'update' | 'remove',
  id: number | string
): string => {
  const path = SEMESTERS_API_CONFIG.endpoints[endpoint].replace('{id}', String(id));
  const base = SEMESTERS_API_CONFIG.baseUrl?.trim() ?? '';

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
};
