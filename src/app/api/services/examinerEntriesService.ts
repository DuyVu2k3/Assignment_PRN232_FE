import { buildExaminerMeEntriesUrl, buildExaminerMeGradeEntriesUrl } from '../config/examinerEntriesApiConfig';
import { requestJson } from '../http/requestJson';
import type { PagedGradeEntriesResponse } from './gradeEntriesService';

export interface ExaminerMyGradeSummary {
  id: number;
  totalScore: number;
  notes: string | null;
  gradedAt: string;
}

export interface ExaminerBatchDto {
  id: number;
  submissionFileId: number;
  examId: number;
  examTitle: string;
  examDueDate: string;
  semesterId: number;
  uploadedByUserId: number;
  status: number;
  errorMessage: string | null;
  uploadedAt: string;
  processedAt: string | null;
  notes: string | null;
  assignmentId: number;
  assignedAt: string;
}

export interface ExaminerEntryDto {
  id: number;
  submissionBatchId: number;
  studentCode: string;
  status: number;
  metadata: string | null;
  temporaryScore: number | null;
  extractedAt: string | null;
  assetCount: number;
  violationCount: number;
  myGrade: ExaminerMyGradeSummary | null;
}

export interface ExaminerMeBatchGroup {
  batchId: number;
  batch: ExaminerBatchDto;
  entries: ExaminerEntryDto[];
}

const normalizeMeEntries = (raw: unknown): ExaminerMeBatchGroup[] => {
  if (Array.isArray(raw)) {
    return raw as ExaminerMeBatchGroup[];
  }

  if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data: unknown }).data)) {
    return (raw as { data: ExaminerMeBatchGroup[] }).data;
  }

  return [];
};

export const examinerEntriesService = {
  getMyEntries: async (): Promise<ExaminerMeBatchGroup[]> => {
    const raw = await requestJson<unknown>({
      url: buildExaminerMeEntriesUrl(),
      method: 'GET',
    });

    return normalizeMeEntries(raw);
  },

  /**
   * Lịch sử chấm điểm của examiner hiện tại — backend lấy examiner từ JWT (không truyền examinerId).
   * GET /api/examiners/me/grade-entries?PageNumber=&PageSize=
   */
  getMyGradeHistory: async (params: {
    pageNumber: number;
    pageSize: number;
  }): Promise<PagedGradeEntriesResponse> => {
    const url = buildExaminerMeGradeEntriesUrl(params.pageNumber, params.pageSize);
    const raw = await requestJson<unknown>({
      url,
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
