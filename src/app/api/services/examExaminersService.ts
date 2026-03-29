import { requestJson } from '../http/requestJson';

export interface ExamExaminerAssignment {
  examId: number;
  userId: number;
}

const parseMaybeJson = <T>(value: unknown): T => {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }

  return value as T;
};

const normalizeAssignment = (value: unknown): ExamExaminerAssignment => {
  const data = (value ?? {}) as Record<string, unknown>;
  return {
    examId: Number(data.examId ?? data.examID ?? data.ExamId ?? 0),
    userId: Number(data.userId ?? data.userID ?? data.UserId ?? 0),
  };
};

const normalizeAssignmentList = (value: unknown): ExamExaminerAssignment[] => {
  const parsed = parseMaybeJson<unknown>(value);

  const source = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as Record<string, unknown>).data)
      ? ((parsed as Record<string, unknown>).data as unknown[])
      : [];

  return source
    .map((item) => normalizeAssignment(item))
    .filter((item) => Number.isInteger(item.examId) && item.examId > 0 && Number.isInteger(item.userId) && item.userId > 0);
};

const buildExamExaminersUrl = (examId: number | string): string => `/api/exams/${examId}/examiners`;
const buildExamExaminerByUserUrl = (examId: number | string, userId: number | string): string =>
  `/api/exams/${examId}/examiners/${userId}`;

export const examExaminersService = {
  getByExamId: async (examId: number): Promise<ExamExaminerAssignment[]> => {
    const raw = await requestJson<unknown>({
      url: buildExamExaminersUrl(examId),
      method: 'GET',
    });

    return normalizeAssignmentList(raw);
  },

  assign: async (examId: number, userId: number): Promise<ExamExaminerAssignment> => {
    const raw = await requestJson<unknown>({
      url: buildExamExaminersUrl(examId),
      method: 'POST',
      body: { userId },
    });

    return normalizeAssignment(parseMaybeJson<unknown>(raw));
  },

  remove: async (examId: number, userId: number): Promise<void> => {
    await requestJson<unknown>({
      url: buildExamExaminerByUserUrl(examId, userId),
      method: 'DELETE',
    });
  },
};
