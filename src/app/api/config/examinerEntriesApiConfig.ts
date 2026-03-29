const submissionEnv = (import.meta as { env: { VITE_SUBMISSION_API_BASE_URL?: string } }).env;
const submissionApiBase =
  typeof submissionEnv.VITE_SUBMISSION_API_BASE_URL === 'string'
    ? submissionEnv.VITE_SUBMISSION_API_BASE_URL.trim().replace(/\/$/, '')
    : '';

export const EXAMINER_ENTRIES_API_CONFIG = {
  baseUrl: submissionApiBase,
  endpoints: {
    meEntries: '/api/examiners/me/entries',
    /** Lịch sử chấm điểm của examiner đang đăng nhập (Bearer) — tương tự pattern /me. */
    meGradeEntries: '/api/examiners/me/grade-entries',
  },
} as const;

export const buildExaminerMeEntriesUrl = (): string => {
  const base = EXAMINER_ENTRIES_API_CONFIG.baseUrl?.trim().replace(/\/$/, '') ?? '';
  const path = EXAMINER_ENTRIES_API_CONFIG.endpoints.meEntries;

  if (!base) {
    return path;
  }

  return `${base}${path}`;
};

export const buildExaminerMeGradeEntriesUrl = (pageNumber: number, pageSize: number): string => {
  const base = EXAMINER_ENTRIES_API_CONFIG.baseUrl?.trim().replace(/\/$/, '') ?? '';
  const path = EXAMINER_ENTRIES_API_CONFIG.endpoints.meGradeEntries;
  const q = new URLSearchParams();
  q.set('PageNumber', String(pageNumber));
  q.set('PageSize', String(pageSize));
  const withQuery = `${path}?${q.toString()}`;

  if (!base) {
    return withQuery;
  }

  return `${base}${withQuery}`;
};
