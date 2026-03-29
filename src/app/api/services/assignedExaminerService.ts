import { requestJson } from '../http/requestJson';
import { buildSubmissionsUrl } from '../config/submissionsApiConfig';

export interface AssignedExaminerPayload {
  submissionBatchId: number;
  examinerId: number;
}

export const assignedExaminerService = {
  assignToBatch: async (payload: AssignedExaminerPayload): Promise<void> => {
    await requestJson<unknown>({
      url: buildSubmissionsUrl('assignedExaminer'),
      method: 'POST',
      body: payload,
    });
  },
};
