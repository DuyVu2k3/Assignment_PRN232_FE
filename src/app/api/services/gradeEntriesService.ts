import { buildGradeEntriesUrl } from '../config/gradeEntriesApiConfig';
import { requestJson } from '../http/requestJson';

export interface GradeEntryRow {
  id: number;
  submissionEntryId: number;
  examinerId: number;
  score: number;
  notes: string | null;
  gradedAt: string;
}

export interface PagedGradeEntriesResponse {
  data: GradeEntryRow[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface GetGradeEntriesParams {
  pageNumber: number;
  pageSize: number;
  examinerId?: number;
  /** Thêm nếu backend hỗ trợ lọc */
  examId?: number;
  semesterId?: number;
  submissionBatchId?: number;
}

const buildQuery = (p: GetGradeEntriesParams): string => {
  const q = new URLSearchParams();
  q.set('PageNumber', String(p.pageNumber));
  q.set('PageSize', String(p.pageSize));
  if (p.examinerId !== undefined && p.examinerId > 0) {
    q.set('ExaminerId', String(p.examinerId));
  }
  if (p.examId !== undefined && p.examId > 0) {
    q.set('ExamId', String(p.examId));
  }
  if (p.semesterId !== undefined && p.semesterId > 0) {
    q.set('SemesterId', String(p.semesterId));
  }
  if (p.submissionBatchId !== undefined && p.submissionBatchId > 0) {
    q.set('SubmissionBatchId', String(p.submissionBatchId));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
};

export const gradeEntriesService = {
  getGradeEntries: async (params: GetGradeEntriesParams): Promise<PagedGradeEntriesResponse> => {
    const path = buildGradeEntriesUrl('list') + buildQuery(params);
    const raw = await requestJson<unknown>({
      url: path,
      method: 'GET',
    });
    if (raw && typeof raw === 'object' && 'data' in raw) {
      return raw as PagedGradeEntriesResponse;
    }
    return {
      data: [],
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      totalItems: 0,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    };
  },
};
