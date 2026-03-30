const submissionEnv = (import.meta as { env: { VITE_SUBMISSION_API_BASE_URL?: string } }).env;
const submissionApiBase =
  typeof submissionEnv.VITE_SUBMISSION_API_BASE_URL === 'string'
    ? submissionEnv.VITE_SUBMISSION_API_BASE_URL.trim().replace(/\/$/, '')
    : '';

export const GRADE_ENTRIES_API_CONFIG = {
  baseUrl: submissionApiBase,
  endpoints: {
    list: '/grade-entries',
  },
} as const;

export type GradeEntriesEndpointKey = keyof typeof GRADE_ENTRIES_API_CONFIG.endpoints;

export const buildGradeEntriesUrl = (endpoint: GradeEntriesEndpointKey): string => {
  const base = GRADE_ENTRIES_API_CONFIG.baseUrl?.trim() ?? '';
  const path = GRADE_ENTRIES_API_CONFIG.endpoints[endpoint];

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
};

export const buildGradeEntriesBySubmissionUrl = (submissionEntryId: number): string => {
  const base = GRADE_ENTRIES_API_CONFIG.baseUrl?.trim().replace(/\/$/, '') ?? '';
  const path = `/grade-entries/submission/${submissionEntryId}`;

  if (!base) {
    return path;
  }

  return `${base}${path}`;
};
