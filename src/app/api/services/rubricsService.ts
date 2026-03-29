import { buildRubricByIdUrl, buildRubricsByExamUrl } from '../config/rubricsApiConfig';
import { requestJson } from '../http/requestJson';

export interface Rubric {
  id: number;
  examId: number;
  criteria: string;
  maxScore: number;
  orderIndex: number;
}

export interface CreateRubricPayload {
  criteria: string;
  maxScore: number;
  orderIndex: number;
}

export interface UpdateRubricPayload {
  criteria: string;
  maxScore: number;
  orderIndex: number;
}

const parseMaybeJson = <T>(value: unknown): T => {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }

  return value as T;
};

export const rubricsService = {
  getRubricsByExamId: async (examId: number): Promise<Rubric[]> => {
    const raw = await requestJson<unknown>({
      url: buildRubricsByExamUrl('listByExam', examId),
      method: 'GET',
    });

    return parseMaybeJson<Rubric[]>(raw);
  },

  createRubricByExamId: async (examId: number, payload: CreateRubricPayload): Promise<Rubric> => {
    const raw = await requestJson<unknown>({
      url: buildRubricsByExamUrl('createByExam', examId),
      method: 'POST',
      body: payload,
    });

    return parseMaybeJson<Rubric>(raw);
  },

  updateRubric: async (id: number, payload: UpdateRubricPayload): Promise<Rubric> => {
    const raw = await requestJson<unknown>({
      url: buildRubricByIdUrl(id),
      method: 'PUT',
      body: payload,
    });

    return parseMaybeJson<Rubric>(raw);
  },

  deleteRubric: async (id: number): Promise<void> => {
    await requestJson<unknown>({
      url: buildRubricByIdUrl(id),
      method: 'DELETE',
    });
  },
};
