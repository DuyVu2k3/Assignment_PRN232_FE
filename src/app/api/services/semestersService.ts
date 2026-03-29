import { buildSemesterByIdUrl, buildSemestersUrl } from '../config/semestersApiConfig';
import { requestJson } from '../http/requestJson';

export interface Semester {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CreateSemesterPayload {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateSemesterPayload {
  name: string;
  startDate: string;
  endDate: string;
}

const parseMaybeJson = <T>(value: unknown): T => {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }

  return value as T;
};

export const semestersService = {
  getSemesters: async (): Promise<Semester[]> => {
    const raw = await requestJson<unknown>({
      url: buildSemestersUrl('list'),
      method: 'GET',
    });

    return parseMaybeJson<Semester[]>(raw);
  },

  createSemester: async (payload: CreateSemesterPayload): Promise<Semester> => {
    const raw = await requestJson<unknown>({
      url: buildSemestersUrl('create'),
      method: 'POST',
      body: payload,
    });

    return parseMaybeJson<Semester>(raw);
  },

  getSemesterById: async (id: number): Promise<Semester> => {
    const raw = await requestJson<unknown>({
      url: buildSemesterByIdUrl('detail', id),
      method: 'GET',
    });

    return parseMaybeJson<Semester>(raw);
  },

  updateSemester: async (id: number, payload: UpdateSemesterPayload): Promise<Semester> => {
    const raw = await requestJson<unknown>({
      url: buildSemesterByIdUrl('update', id),
      method: 'PUT',
      body: payload,
    });

    return parseMaybeJson<Semester>(raw);
  },

  deleteSemester: async (id: number): Promise<void> => {
    await requestJson<unknown>({
      url: buildSemesterByIdUrl('remove', id),
      method: 'DELETE',
    });
  },
};
