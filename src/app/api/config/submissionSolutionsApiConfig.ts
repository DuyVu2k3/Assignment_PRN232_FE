const submissionEnv = (import.meta as { env: { VITE_SUBMISSION_API_BASE_URL?: string } }).env;
const submissionApiBase =
  typeof submissionEnv.VITE_SUBMISSION_API_BASE_URL === 'string'
    ? submissionEnv.VITE_SUBMISSION_API_BASE_URL.trim().replace(/\/$/, '')
    : '';

export const SUBMISSION_SOLUTIONS_API_CONFIG = {
  baseUrl: submissionApiBase,
  endpoints: {
    files: '/submission-solutions/{submissionEntryId}/files',
    download: '/submission-solutions/{submissionEntryId}/download',
  },
} as const;

export type SubmissionSolutionsEndpointKey = keyof typeof SUBMISSION_SOLUTIONS_API_CONFIG.endpoints;

const replaceEntryId = (path: string, submissionEntryId: number): string =>
  path.replace('{submissionEntryId}', String(submissionEntryId));

export const buildSubmissionSolutionsUrl = (
  endpoint: 'files' | 'download',
  submissionEntryId: number
): string => {
  const base = SUBMISSION_SOLUTIONS_API_CONFIG.baseUrl?.trim().replace(/\/$/, '') ?? '';
  const path = replaceEntryId(SUBMISSION_SOLUTIONS_API_CONFIG.endpoints[endpoint], submissionEntryId);

  if (!base) {
    return path;
  }

  return `${base}${path}`;
};
