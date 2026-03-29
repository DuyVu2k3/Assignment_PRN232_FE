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

/** GET /api/semesters — backend có thể trả mảng hoặc { data: [...] }. */
const normalizeSemestersList = (raw: unknown): Semester[] => {
  const parsed = parseMaybeJson<unknown>(raw);
  if (Array.isArray(parsed)) {
    return parsed as Semester[];
  }
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    const data = (parsed as { data: unknown }).data;
    if (Array.isArray(data)) {
      return data as Semester[];
    }
  }
  return [];
};

const normalizeSemester = (raw: unknown): Semester => {
  const parsed = parseMaybeJson<unknown>(raw);
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    const inner = (parsed as { data: unknown }).data;
    if (inner && typeof inner === 'object') {
      return inner as Semester;
    }
  }
  return parsed as Semester;
};

export const semestersService = {
  getSemesters: async (): Promise<Semester[]> => {
    const raw = await requestJson<unknown>({
      url: buildSemestersUrl('list'),
      method: 'GET',
    });

    return normalizeSemestersList(raw);
  },

  createSemester: async (payload: CreateSemesterPayload): Promise<Semester> => {
    const raw = await requestJson<unknown>({
      url: buildSemestersUrl('create'),
      method: 'POST',
      body: payload,
    });

    return normalizeSemester(raw);
  },

  getSemesterById: async (id: number): Promise<Semester> => {
    const raw = await requestJson<unknown>({
      url: buildSemesterByIdUrl('detail', id),
      method: 'GET',
    });

    return normalizeSemester(raw);
  },

  updateSemester: async (id: number, payload: UpdateSemesterPayload): Promise<Semester> => {
    const raw = await requestJson<unknown>({
      url: buildSemesterByIdUrl('update', id),
      method: 'PUT',
      body: payload,
    });

    return normalizeSemester(raw);
  },

  deleteSemester: async (id: number): Promise<void> => {
    await requestJson<unknown>({
      url: buildSemesterByIdUrl('remove', id),
      method: 'DELETE',
    });
  },
};
