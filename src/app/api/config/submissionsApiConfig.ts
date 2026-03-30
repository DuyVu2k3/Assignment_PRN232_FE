export const SUBMISSIONS_API_CONFIG = {
  baseUrl: '',
  endpoints: {
    uploadFile: '/submission-files',
    assignedExaminer: '/assigned-examiners',
    assignedExaminerById: '/assigned-examiners/{id}',
  },
} as const;

export type SubmissionsEndpointKey = keyof typeof SUBMISSIONS_API_CONFIG.endpoints;

export const buildSubmissionsUrl = (endpoint: SubmissionsEndpointKey): string => {
  const base = SUBMISSIONS_API_CONFIG.baseUrl?.trim() ?? '';
  const path = SUBMISSIONS_API_CONFIG.endpoints[endpoint];

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
};

export const buildAssignedExaminerByIdUrl = (id: number | string): string => {
  const base = SUBMISSIONS_API_CONFIG.baseUrl?.trim() ?? '';
  const path = SUBMISSIONS_API_CONFIG.endpoints.assignedExaminerById.replace('{id}', String(id));

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
};
