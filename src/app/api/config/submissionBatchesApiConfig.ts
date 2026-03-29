/**
 * Gọi đúng submission service (vd http://localhost:7003).
 * Nếu để trống, dev phải có proxy trong vite.config (không thì Vite trả index.html).
 */
const submissionEnv = (import.meta as { env: { VITE_SUBMISSION_API_BASE_URL?: string } }).env;
const submissionApiBase =
  typeof submissionEnv.VITE_SUBMISSION_API_BASE_URL === 'string'
    ? submissionEnv.VITE_SUBMISSION_API_BASE_URL.trim().replace(/\/$/, '')
    : '';

export const SUBMISSION_BATCHES_API_CONFIG = {
  baseUrl: submissionApiBase,
  endpoints: {
    list: '/submission-batches',
  },
} as const;

export type SubmissionBatchesEndpointKey = keyof typeof SUBMISSION_BATCHES_API_CONFIG.endpoints;

export const buildSubmissionBatchesUrl = (endpoint: SubmissionBatchesEndpointKey): string => {
  const base = SUBMISSION_BATCHES_API_CONFIG.baseUrl?.trim() ?? '';
  const path = SUBMISSION_BATCHES_API_CONFIG.endpoints[endpoint];

  if (!base) {
    return path;
  }

  return `${base.replace(/\/$/, '')}${path}`;
};
