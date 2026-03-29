export const EXAMS_API_CONFIG = {
  baseUrl: '',
  endpoints: {
    list: '/api/exams',
    create: '/api/exams',
    detail: '/api/exams/{id}',
    update: '/api/exams/{id}',
    remove: '/api/exams/{id}',
  },
} as const;

export type ExamsEndpointKey = keyof typeof EXAMS_API_CONFIG.endpoints;

export const buildExamsUrl = (endpoint: ExamsEndpointKey): string => {
  const base = EXAMS_API_CONFIG.baseUrl?.trim() ?? '';
  const path = EXAMS_API_CONFIG.endpoints[endpoint];

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
};

export const buildExamByIdUrl = (
  endpoint: 'detail' | 'update' | 'remove',
  id: number | string
): string => {
  const path = EXAMS_API_CONFIG.endpoints[endpoint].replace('{id}', String(id));
  const base = EXAMS_API_CONFIG.baseUrl?.trim() ?? '';

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
};
