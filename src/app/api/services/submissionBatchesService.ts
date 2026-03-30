import { buildSubmissionBatchesUrl } from '../config/submissionBatchesApiConfig';
import { requestJson } from '../http/requestJson';

export interface AssignedExaminerOnBatch {
  assignmentId: number;
  examinerId: number;
  examinerName: string;
  assignedAt: string;
}

export interface SubmissionBatchListItem {
  id: number;
  submissionFileId: number;
  examId: number;
  uploadedByUserId: number;
  status: number;
  errorMessage: string | null;
  uploadedAt: string;
  processedAt: string | null;
  notes: string | null;
  assignedExaminers: AssignedExaminerOnBatch[];
}

const parseMaybeJson = <T>(value: unknown): T => {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }
  return value as T;
};

export const submissionBatchesService = {
  getSubmissionBatches: async (): Promise<SubmissionBatchListItem[]> => {
    const raw = await requestJson<unknown>({
      url: buildSubmissionBatchesUrl('list'),
      method: 'GET',
    });
    const parsed = parseMaybeJson<unknown>(raw);
    if (Array.isArray(parsed)) {
      return parsed as SubmissionBatchListItem[];
    }
    if (parsed && typeof parsed === 'object' && 'data' in parsed) {
      const data = (parsed as { data: unknown }).data;
      if (Array.isArray(data)) {
        return data as SubmissionBatchListItem[];
      }
    }
    return [];
  },
};
