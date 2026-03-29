export const RUBRICS_API_CONFIG = {
  baseUrl: '',
  endpoints: {
    listByExam: '/api/exams/{examId}/rubrics',
    createByExam: '/api/exams/{examId}/rubrics',
    update: '/api/rubrics/{id}',
    remove: '/api/rubrics/{id}',
  },
} as const;

const withBase = (path: string): string => {
  const base = RUBRICS_API_CONFIG.baseUrl?.trim() ?? '';

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
};

export const buildRubricsByExamUrl = (
  endpoint: 'listByExam' | 'createByExam',
  examId: number | string
): string => {
  const path = RUBRICS_API_CONFIG.endpoints[endpoint].replace('{examId}', String(examId));
  return withBase(path);
};

export const buildRubricByIdUrl = (id: number | string): string => {
  const path = RUBRICS_API_CONFIG.endpoints.update.replace('{id}', String(id));
  return withBase(path);
};
