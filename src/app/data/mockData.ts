import type {
  AssignedExaminer,
  CachedExam,
  CachedExaminer,
  CachedSemester,
  Exam,
  GradeEntry,
  GradeRubricScore,
  Rubric,
  Semester,
  Submission,
  SubmissionAsset,
  SubmissionBatch,
  SubmissionEntry,
  SubmissionFile,
  SubmissionViolation,
  User,
} from '../types';

// Mock data has been intentionally removed.
export const EXAMPLE_PRN232_ARCHIVE_NAME = '';

export const mockSemesters: Semester[] = [];
export const mockExams: Exam[] = [];
export const mockRubrics: Rubric[] = [];
export const mockSubmissionFiles: SubmissionFile[] = [];
export const mockSubmissionBatches: SubmissionBatch[] = [];
export const mockSubmissionEntries: SubmissionEntry[] = [];
export const mockSubmissionAssets: SubmissionAsset[] = [];
export const mockSubmissionViolations: SubmissionViolation[] = [];
export const mockAssignedExaminers: AssignedExaminer[] = [];
export const mockGradeEntries: GradeEntry[] = [];
export const mockGradeRubricScores: GradeRubricScore[] = [];
export const mockCachedSemesters: CachedSemester[] = [];
export const mockCachedExams: CachedExam[] = [];
export const mockCachedExaminers: CachedExaminer[] = [];
export const mockUsers: User[] = [];
export const mockSubmissions: Submission[] = [];

export function getRubricsForExam(examId: string): Rubric[] {
  return mockRubrics
    .filter((r) => r.examId === examId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export function formatExamPeriod(exam: Exam): string {
  const sem = mockSemesters.find((s) => s.id === exam.semesterId);
  const term = sem?.code ?? '';
  const session = exam.examSessionLabel?.trim();

  if (term && session) return `${term} · ${session}`;
  if (session) return session;
  return term || '--';
}

export function countViolationsForEntry(entryId: string): number {
  return mockSubmissionViolations.filter((v) => v.submissionEntryId === entryId).length;
}

export function countAssetsForEntry(entryId: string): number {
  return mockSubmissionAssets.filter((a) => a.submissionEntryId === entryId).length;
}

export function getSubmissionBatchById(batchId: string): SubmissionBatch | undefined {
  return mockSubmissionBatches.find((b) => b.id === batchId);
}

export function getEntriesForBatch(batchId: string): SubmissionEntry[] {
  return mockSubmissionEntries.filter((e) => e.submissionBatchId === batchId);
}

export function getAssetsForEntry(entryId: string): SubmissionAsset[] {
  return mockSubmissionAssets.filter((a) => a.submissionEntryId === entryId);
}

export function getSubmissionFileById(fileId: string): SubmissionFile | undefined {
  return mockSubmissionFiles.find((f) => f.id === fileId);
}

export function getBatchesForExaminer(examinerUserId: string): SubmissionBatch[] {
  const uid = String(examinerUserId);
  const assignments = mockAssignedExaminers.filter((a) => a.examinerUserId === uid);

  const examAll = new Set(assignments.filter((a) => !a.submissionBatchId).map((a) => a.examId));
  const batchSet = new Set(assignments.filter((a) => a.submissionBatchId).map((a) => a.submissionBatchId as string));

  return mockSubmissionBatches.filter((b) => examAll.has(b.examId) || batchSet.has(b.id));
}

export function examinerCanAccessBatch(examinerUserId: string, batchId: string): boolean {
  return getBatchesForExaminer(examinerUserId).some((b) => b.id === batchId);
}
