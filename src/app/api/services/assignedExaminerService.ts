import { requestJson } from '../http/requestJson';
import { buildAssignedExaminerByIdUrl, buildSubmissionsUrl } from '../config/submissionsApiConfig';

export interface AssignedExaminerPayload {
  submissionBatchId: number;
  examinerId: number;
}

export interface AssignedExaminerRecord {
  id: number;
  examId: number;
  examinerId: number;
  submissionBatchId: number;
  assignedAt: string;
}

export interface AssignedExaminerQuery {
  examId?: number;
  batchId?: number;
  examinerId?: number;
}

const parseMaybeJson = <T>(value: unknown): T => {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }

  return value as T;
};

export const assignedExaminerService = {
  assignToBatch: async (payload: AssignedExaminerPayload): Promise<void> => {
    await requestJson<unknown>({
      url: buildSubmissionsUrl('assignedExaminer'),
      method: 'POST',
      body: payload,
    });
  },

  getAssignedExaminers: async (query?: AssignedExaminerQuery): Promise<AssignedExaminerRecord[]> => {
    const url = new URL(buildSubmissionsUrl('assignedExaminer'), window.location.origin);

    if (query?.examId !== undefined) {
      url.searchParams.set('examId', String(query.examId));
    }
    if (query?.batchId !== undefined) {
      url.searchParams.set('batchId', String(query.batchId));
    }
    if (query?.examinerId !== undefined) {
      url.searchParams.set('examinerId', String(query.examinerId));
    }

    const raw = await requestJson<unknown>({
      url: `${url.pathname}${url.search}`,
      method: 'GET',
    });

    return parseMaybeJson<AssignedExaminerRecord[]>(raw);
  },

  removeAssignedExaminer: async (id: number): Promise<void> => {
    await requestJson<unknown>({
      url: buildAssignedExaminerByIdUrl(id),
      method: 'DELETE',
    });
  },
};
