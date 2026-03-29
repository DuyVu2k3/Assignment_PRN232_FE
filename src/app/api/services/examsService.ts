import { buildExamByIdUrl, buildExamsUrl } from '../config/examsApiConfig';
import { requestJson } from '../http/requestJson';

export interface Exam {
  id: number;
  title: string;
  dueDate: string;
  semesterId: number;
  semesterName?: string;
  totalMaxScore?: number;
  createdByUserId?: number;
  createdAt?: string;
}

export interface CreateExamPayload {
  title: string;
  dueDate: string;
  semesterId: number;
}

export interface UpdateExamPayload {
  title: string;
  dueDate: string;
  semesterId: number;
}

const parseMaybeJson = <T>(value: unknown): T => {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }

  return value as T;
};

export const examsService = {
  getExams: async (): Promise<Exam[]> => {
    const raw = await requestJson<unknown>({
      url: buildExamsUrl('list'),
      method: 'GET',
    });

    return parseMaybeJson<Exam[]>(raw);
  },

  createExam: async (payload: CreateExamPayload): Promise<Exam> => {
    const raw = await requestJson<unknown>({
      url: buildExamsUrl('create'),
      method: 'POST',
      body: payload,
    });

    return parseMaybeJson<Exam>(raw);
  },

  getExamById: async (id: number): Promise<Exam> => {
    const raw = await requestJson<unknown>({
      url: buildExamByIdUrl('detail', id),
      method: 'GET',
    });

    return parseMaybeJson<Exam>(raw);
  },

  updateExam: async (id: number, payload: UpdateExamPayload): Promise<Exam> => {
    const raw = await requestJson<unknown>({
      url: buildExamByIdUrl('update', id),
      method: 'PUT',
      body: payload,
    });

    return parseMaybeJson<Exam>(raw);
  },

  deleteExam: async (id: number): Promise<void> => {
    await requestJson<unknown>({
      url: buildExamByIdUrl('remove', id),
      method: 'DELETE',
    });
  },
};
