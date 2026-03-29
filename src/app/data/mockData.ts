/**
 * Exam ở đây = **kỳ thi** (đợt thi: SU25/FA25 + Block 10w, Block 3w…), không phải mã đề.
 * PRN232 là **môn**; mỗi bản ghi Exam là một kỳ PE cụ thể (vd SU25 Block 10w).
 * Moderator upload .rar → batch → entries → assets / violations.
 * Manager cấu hình rubric; Examiner chấm theo tiêu chí.
 */
import type {
  AssignedExaminer,
  CachedExam,
  CachedExaminer,
  CachedSemester,
  Exam,
  ExamExaminer,
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

const U = {
  admin: '1',
  manager: '2',
  ex1: '3',
  ex2: '4',
  ex3: '5',
  mod: '6',
} as const;

/** Tên file thật từ kịch bản upload (Moderator). */
export const EXAMPLE_PRN232_ARCHIVE_NAME =
  'PRN232_SU25_PE_Block10w_VuLNS_(SE1728,SE1729,SE1733)_2.rar';

/** Demo chỉ môn PRN232 — một kỳ học mẫu (SU25). */
export const mockSemesters: Semester[] = [
  {
    id: 'sem-su25',
    code: 'SU25',
    name: 'Summer 2025',
    schoolYear: '2024-2025',
    startDate: '2025-05-01',
    endDate: '2025-08-31',
  },
];

export const mockExamExaminers: ExamExaminer[] = [
  { examId: 'exam-1', examinerUserId: U.ex1 },
  { examId: 'exam-1', examinerUserId: U.ex2 },
  { examId: 'exam-1b', examinerUserId: U.ex1 },
];

function examinerIdsForExam(examId: string): string[] {
  return [...new Set(mockExamExaminers.filter((r) => r.examId === examId).map((r) => r.examinerUserId))];
}

/** exam-1 = kỳ thi PE môn PRN232, đợt SU25 · Block 10w (điểm max = tổng rubric). */
export const mockExams: Exam[] = [
  {
    id: 'exam-1',
    semesterId: 'sem-su25',
    title: 'PE PRN232 — SU25 · Block 10w (lớp VuLNS)',
    subject: 'PRN232',
    courseCode: 'PRN232',
    examSessionLabel: 'Block 10w',
    description:
      'Kỳ thi thực hành (PE) môn PRN232 trong đợt Summer 2025, block 10 tuần. SV nộp khối .rar/.zip theo MSSV; hệ thống giải nén batch → entry → asset & violation cho Moderator.',
    totalPoints: 10,
    duration: 120,
    createdAt: '2026-03-18T08:00:00Z',
    status: 'Active',
    createdBy: 'Manager User',
    examinerUserIds: examinerIdsForExam('exam-1'),
  },
  {
    id: 'exam-1b',
    semesterId: 'sem-su25',
    title: 'PE PRN232 — SU25 · Block 3w',
    subject: 'PRN232',
    courseCode: 'PRN232',
    examSessionLabel: 'Block 3w',
    description: 'Cùng môn PRN232, đợt thi khác (block 3 tuần) trong SU25.',
    totalPoints: 10,
    duration: 90,
    createdAt: '2026-04-01T08:00:00Z',
    status: 'Draft',
    createdBy: 'Manager User',
    examinerUserIds: examinerIdsForExam('exam-1b'),
  },
];

/** Tiêu chí chấm PRN232 PE (Manager thêm qua UI/API tương tự). */
export const mockRubrics: Rubric[] = [
  {
    id: 'rub-prn-postman',
    examId: 'exam-1',
    title: 'Postman collection / script',
    description: 'Kiểm thử API: đúng request, test script, tối đa 2 điểm',
    maxPoints: 2,
    orderIndex: 1,
  },
  {
    id: 'rub-prn-report',
    examId: 'exam-1',
    title: 'Báo cáo / README',
    description: 'Mô tả kiến trúc, hướng dẫn chạy — tối đa 2 điểm',
    maxPoints: 2,
    orderIndex: 2,
  },
  {
    id: 'rub-prn-code',
    examId: 'exam-1',
    title: 'Mã nguồn & cấu trúc dự án',
    description: 'Clean code, layered, build chạy được — tối đa 3 điểm',
    maxPoints: 3,
    orderIndex: 3,
  },
  {
    id: 'rub-prn-demo',
    examId: 'exam-1',
    title: 'Demo / ghi hình (nếu có trong rubric course)',
    description: 'Tối đa 3 điểm',
    maxPoints: 3,
    orderIndex: 4,
  },
  {
    id: 'rub-1b-postman',
    examId: 'exam-1b',
    title: 'Postman collection / script',
    description: 'Kiểm thử API: đúng request, test script, tối đa 2 điểm',
    maxPoints: 2,
    orderIndex: 1,
  },
  {
    id: 'rub-1b-report',
    examId: 'exam-1b',
    title: 'Báo cáo / README',
    description: 'Mô tả kiến trúc, hướng dẫn chạy — tối đa 2 điểm',
    maxPoints: 2,
    orderIndex: 2,
  },
  {
    id: 'rub-1b-code',
    examId: 'exam-1b',
    title: 'Mã nguồn & cấu trúc dự án',
    description: 'Clean code, layered, build chạy được — tối đa 3 điểm',
    maxPoints: 3,
    orderIndex: 3,
  },
  {
    id: 'rub-1b-demo',
    examId: 'exam-1b',
    title: 'Demo / ghi hình (nếu có trong rubric course)',
    description: 'Tối đa 3 điểm',
    maxPoints: 3,
    orderIndex: 4,
  },
];

export function getRubricsForExam(examId: string): Rubric[] {
  return mockRubrics.filter((r) => r.examId === examId).sort((a, b) => a.orderIndex - b.orderIndex);
}

/** Hiển thị đợt kỳ thi: mã kỳ học (SU25, FA25) + block — không phải mã đề. */
export function formatExamPeriod(exam: Exam): string {
  const sem = mockSemesters.find((s) => s.id === exam.semesterId);
  const term = sem?.code ?? '';
  const session = exam.examSessionLabel?.trim();
  if (term && session) return `${term} · ${session}`;
  if (session) return session;
  return term || '—';
}

export const mockSubmissionFiles: SubmissionFile[] = [
  {
    id: 'sfile-1',
    originalFileName: EXAMPLE_PRN232_ARCHIVE_NAME,
    storageKey: `uploads/2026/su25/${EXAMPLE_PRN232_ARCHIVE_NAME}`,
    uploadedAt: '2026-03-21T08:00:00Z',
    uploadedByUserId: U.mod,
  },
];

export const mockSubmissionBatches: SubmissionBatch[] = [
  {
    id: 'batch-1',
    submissionFileId: 'sfile-1',
    examId: 'exam-1',
    uploadedByUserId: U.mod,
    status: 'Ready',
    createdAt: '2026-03-21T08:05:00Z',
  },
];

export const mockSubmissionEntries: SubmissionEntry[] = [
  {
    id: 'entry-se1728',
    submissionBatchId: 'batch-1',
    examId: 'exam-1',
    studentCode: 'SE1728',
    studentName: 'Nguyễn Minh An',
    status: 'Grading',
    createdAt: '2026-03-21T10:30:00Z',
  },
  {
    id: 'entry-se1729',
    submissionBatchId: 'batch-1',
    examId: 'exam-1',
    studentCode: 'SE1729',
    studentName: 'Trần Hữu Bình',
    status: 'Pending',
    createdAt: '2026-03-21T10:31:00Z',
  },
  {
    id: 'entry-se1733',
    submissionBatchId: 'batch-1',
    examId: 'exam-1',
    studentCode: 'SE1733',
    studentName: 'Lê Thị Cẩm',
    status: 'Pending',
    createdAt: '2026-03-21T10:32:00Z',
  },
];

export const mockSubmissionAssets: SubmissionAsset[] = [
  {
    id: 'asset-se1728-postman',
    submissionEntryId: 'entry-se1728',
    fileName: 'PRN232_PE.postman_collection.json',
    kind: 'document',
    relativePath: 'SE1728/PRN232_PE.postman_collection.json',
  },
  {
    id: 'asset-se1728-readme',
    submissionEntryId: 'entry-se1728',
    fileName: 'README.md',
    kind: 'document',
    relativePath: 'SE1728/README.md',
  },
  {
    id: 'asset-se1728-sln',
    submissionEntryId: 'entry-se1728',
    fileName: 'PRN232_PE.sln',
    kind: 'code',
    relativePath: 'SE1728/src/PRN232_PE.sln',
  },
  {
    id: 'asset-se1729-postman',
    submissionEntryId: 'entry-se1729',
    fileName: 'api-tests.postman_collection.json',
    kind: 'document',
    relativePath: 'SE1729/api-tests.postman_collection.json',
  },
  {
    id: 'asset-se1729-zip',
    submissionEntryId: 'entry-se1729',
    fileName: 'source.zip',
    kind: 'other',
    relativePath: 'SE1729/source.zip',
  },
  {
    id: 'asset-se1733-readme',
    submissionEntryId: 'entry-se1733',
    fileName: 'README.txt',
    kind: 'document',
    relativePath: 'SE1733/README.txt',
  },
];

export const mockSubmissionViolations: SubmissionViolation[] = [
  {
    id: 'viol-se1733-1',
    submissionEntryId: 'entry-se1733',
    submissionAssetId: null,
    message:
      'Không tìm thấy file Postman collection trong thư mục MSSV — bắt buộc theo rubric kỳ PE.',
    severity: 'error',
  },
  {
    id: 'viol-se1729-1',
    submissionEntryId: 'entry-se1729',
    submissionAssetId: 'asset-se1729-zip',
    message: 'File nén chứa đường dẫn tuyệt đối Windows — nghi ngờ nguy cơ khi autograde.',
    severity: 'warning',
  },
  {
    id: 'viol-se1728-1',
    submissionEntryId: 'entry-se1728',
    submissionAssetId: 'asset-se1728-postman',
    message: 'Postman: thiếu biến môi trường baseUrl — Moderator có thể chấp nhận nếu đề cho phép.',
    severity: 'info',
  },
];

export const mockAssignedExaminers: AssignedExaminer[] = [
  { id: 'asg-1', examId: 'exam-1', examinerUserId: U.ex1, submissionBatchId: null },
  { id: 'asg-2', examId: 'exam-1', examinerUserId: U.ex2, submissionBatchId: 'batch-1' },
];

/** Demo PRN232 chỉ dùng điểm theo rubric. */
export const mockGradeEntries: GradeEntry[] = [];

/**
 * Điểm theo rubric PRN232: ví dụ Postman 1/2 điểm (Examiner đang chấm dở).
 */
export const mockGradeRubricScores: GradeRubricScore[] = [
  {
    id: 'grs-1',
    submissionEntryId: 'entry-se1728',
    rubricId: 'rub-prn-postman',
    examinerUserId: U.ex1,
    score: 1,
    notes: 'Collection chạy được một phần; script assert còn thiếu',
    gradedAt: '2026-03-22T10:00:00Z',
  },
];

export const mockCachedSemesters: CachedSemester[] = mockSemesters.map((s) => ({
  id: s.id,
  code: s.code,
  name: s.name,
}));

export const mockCachedExams: CachedExam[] = mockExams.map((e) => ({
  id: e.id,
  title: e.title,
  semesterId: e.semesterId,
  subject: e.subject,
}));

export const mockCachedExaminers: CachedExaminer[] = [
  { userId: U.ex1, displayName: 'Nguyễn Văn Examiner', email: 'examiner1@example.com' },
  { userId: U.ex2, displayName: 'Trần Thị Examiner', email: 'examiner2@example.com' },
  { userId: U.ex3, displayName: 'Lê Văn Examiner', email: 'examiner3@example.com' },
];

export const mockUsers: User[] = [
  { id: U.admin, name: 'Admin User', email: 'admin@example.com', role: 'Admin', assignedExams: 0, createdAt: '2026-01-01T00:00:00Z' },
  { id: U.manager, name: 'Manager User', email: 'manager@example.com', role: 'Manager', assignedExams: 0, createdAt: '2026-01-15T00:00:00Z' },
  { id: U.ex1, name: 'Nguyễn Văn Examiner', email: 'examiner1@example.com', role: 'Examiner', assignedExams: 5, createdAt: '2026-02-01T00:00:00Z' },
  { id: U.ex2, name: 'Trần Thị Examiner', email: 'examiner2@example.com', role: 'Examiner', assignedExams: 3, createdAt: '2026-02-10T00:00:00Z' },
  { id: U.ex3, name: 'Lê Văn Examiner', email: 'examiner3@example.com', role: 'Examiner', assignedExams: 7, createdAt: '2026-02-20T00:00:00Z' },
  { id: U.mod, name: 'Moderator Upload', email: 'moderator@example.com', role: 'Moderator', assignedExams: 0, createdAt: '2026-02-25T00:00:00Z' },
];

function userNameById(userId: string): string {
  return mockUsers.find((u) => u.id === userId)?.name ?? userId;
}

function gradeStateForEntry(entry: SubmissionEntry): {
  uiStatus: Submission['status'];
  score?: number;
  gradedBy?: string;
  gradedAt?: string;
} {
  const examRubrics = getRubricsForExam(entry.examId);
  const rubricScores = mockGradeRubricScores.filter((s) => s.submissionEntryId === entry.id);
  const legacy = mockGradeEntries.find((g) => g.submissionEntryId === entry.id);

  if (examRubrics.length > 0 && rubricScores.length === 0) {
    return {
      uiStatus: entry.status === 'Grading' ? 'Grading' : 'Pending',
    };
  }

  if (examRubrics.length > 0 && rubricScores.length > 0) {
    const byRubric = new Map<string, GradeRubricScore>();
    for (const s of rubricScores.sort((a, b) => a.gradedAt.localeCompare(b.gradedAt))) {
      byRubric.set(s.rubricId, s);
    }
    const total = [...byRubric.values()].reduce((acc, s) => acc + s.score, 0);
    const rubricDone = examRubrics.every((r) => byRubric.has(r.id));
    const last = [...byRubric.values()].sort((a, b) => b.gradedAt.localeCompare(a.gradedAt))[0];

    return {
      uiStatus: rubricDone ? 'Graded' : 'Grading',
      score: total,
      gradedBy: userNameById(last.examinerUserId),
      gradedAt: rubricDone ? last.gradedAt : undefined,
    };
  }

  if (legacy) {
    return {
      uiStatus: 'Graded',
      score: legacy.score,
      gradedBy: userNameById(legacy.examinerUserId),
      gradedAt: legacy.gradedAt,
    };
  }

  return {
    uiStatus: entry.status === 'Grading' ? 'Grading' : 'Pending',
  };
}

function buildSubmissionRows(): Submission[] {
  return mockSubmissionEntries.map((entry) => {
    const exam = mockExams.find((e) => e.id === entry.examId);
    const { uiStatus, score, gradedBy, gradedAt } = gradeStateForEntry(entry);

    return {
      id: entry.id,
      submissionBatchId: entry.submissionBatchId,
      examId: entry.examId,
      examTitle: exam?.title ?? '',
      studentId: entry.studentCode,
      studentName: entry.studentName,
      submittedAt: entry.createdAt,
      status: uiStatus,
      score,
      gradedBy,
      gradedAt,
      fileUrl: '#',
    };
  });
}

export const mockSubmissions: Submission[] = buildSubmissionRows();

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
  return mockSubmissionEntries
    .filter((e) => e.submissionBatchId === batchId)
    .sort((a, b) => a.studentCode.localeCompare(b.studentCode));
}

export function getAssetsForEntry(entryId: string): SubmissionAsset[] {
  return mockSubmissionAssets.filter((a) => a.submissionEntryId === entryId);
}

export function getSubmissionFileById(fileId: string): SubmissionFile | undefined {
  return mockSubmissionFiles.find((f) => f.id === fileId);
}

/**
 * Batch examiner được phép chấm: gán theo batch cụ thể, hoặc gán cả kỳ thi (mọi batch Ready của exam đó).
 * `examinerUserId` khớp JWT / mock user id (chuỗi).
 */
export function getBatchesForExaminer(examinerUserId: string): SubmissionBatch[] {
  const uid = String(examinerUserId);
  const assignments = mockAssignedExaminers.filter((a) => a.examinerUserId === uid);
  const explicitBatchIds = new Set(
    assignments.filter((a) => a.submissionBatchId != null).map((a) => a.submissionBatchId as string),
  );
  const wholeExamIds = new Set(
    assignments.filter((a) => a.submissionBatchId == null).map((a) => a.examId),
  );

  const seen = new Set<string>();
  const out: SubmissionBatch[] = [];
  for (const b of mockSubmissionBatches) {
    if (b.status !== 'Ready') continue;
    const ok =
      explicitBatchIds.has(b.id) || wholeExamIds.has(b.examId);
    if (ok && !seen.has(b.id)) {
      seen.add(b.id);
      out.push(b);
    }
  }
  return out;
}

export function examinerCanAccessBatch(examinerUserId: string, batchId: string): boolean {
  return getBatchesForExaminer(examinerUserId).some((b) => b.id === batchId);
}
