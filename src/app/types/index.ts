/** Enum domain — import từ đây hoặc `./enums`. */
export {
  UserRole,
  ExamStatus,
  SubmissionBatchStatus,
  SubmissionBatchPipelineStatus,
  SubmissionEntryStatus,
  SubmissionAssetKind,
  ViolationSeverity,
} from './enums';

import type {
  ExamStatus,
  SubmissionAssetKind,
  SubmissionBatchStatus,
  SubmissionEntryStatus,
  UserRole,
  ViolationSeverity,
} from './enums';

/** --- Exam Service --- */

/** Kỳ học / mã kỳ (vd SU25, FA25) — gắn với kỳ thi, khác mã đề. */
export interface Semester {
  id: string;
  code: string;
  name: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
}

/**
 * Exam trong hệ thống = một **kỳ thi** (đợt thi), ví dụ PRN232 PE tại SU25 Block 10w
 * hoặc FA25 Block 3w — không phải “mã đề” từng bộ câu hỏi.
 * Môn học: courseCode / subject (vd PRN232).
 */
export interface Exam {
  id: string;
  semesterId: string;
  title: string;
  /** Tên môn hiển thị (thường trùng mã môn như PRN232). */
  subject: string;
  /** Mã môn (vd PRN232). */
  courseCode?: string;
  /**
   * Đợt thi trong kỳ học: Block 10w, Block 3w…
   * Kết hợp với Semester.code (SU25, FA25) mô tả đúng “kỳ thi”.
   */
  examSessionLabel?: string;
  description: string;
  totalPoints: number;
  duration: number;
  createdAt: string;
  status: ExamStatus;
  createdBy: string;
  /** UserId examiner — khớp bảng ExamExaminers (many-to-many Exam ↔ User). */
  examinerUserIds: string[];
}

export interface Rubric {
  id: string;
  examId: string;
  title: string;
  description: string;
  maxPoints: number;
  orderIndex: number;
}

/** Quan hệ Exam ↔ Examiner (User có role Examiner). */
export interface ExamExaminer {
  examId: string;
  examinerUserId: string;
}

/** --- Submission Service --- */

export interface SubmissionFile {
  id: string;
  originalFileName: string;
  storageKey: string;
  uploadedAt: string;
  uploadedByUserId: string;
}

export interface SubmissionBatch {
  id: string;
  submissionFileId: string;
  examId: string;
  uploadedByUserId: string;
  status: SubmissionBatchStatus;
  createdAt: string;
}

export interface SubmissionEntry {
  id: string;
  submissionBatchId: string;
  examId: string;
  studentCode: string;
  studentName: string;
  /** Trạng thái nghiệp vụ sau giải nén / trước-khi chấm. */
  status: SubmissionEntryStatus;
  createdAt: string;
}

export interface SubmissionAsset {
  id: string;
  submissionEntryId: string;
  fileName: string;
  kind: SubmissionAssetKind;
  relativePath: string;
}

export interface SubmissionViolation {
  id: string;
  submissionEntryId: string;
  submissionAssetId: string | null;
  message: string;
  severity: ViolationSeverity;
}

/**
 * Phân công chấm: theo cả đề (batchId null) hoặc theo batch cụ thể.
 * Khớp bảng assigned_examiners.
 */
export interface AssignedExaminer {
  id: string;
  examId: string;
  examinerUserId: string;
  submissionBatchId: string | null;
}

/** Tổng điểm một lần chấm (legacy / đề không tách rubric). */
export interface GradeEntry {
  id: string;
  submissionEntryId: string;
  examinerUserId: string;
  score: number;
  notes: string | null;
  gradedAt: string;
}

/** Điểm theo từng tiêu chí rubric (Examiner chấm ví dụ: Postman 1/2 điểm). */
export interface GradeRubricScore {
  id: string;
  submissionEntryId: string;
  rubricId: string;
  examinerUserId: string;
  score: number;
  notes: string | null;
  gradedAt: string;
}

/** Cache trong Submission service (không FK chéo service). */
export interface CachedSemester {
  id: string;
  code: string;
  name: string;
}

export interface CachedExam {
  id: string;
  title: string;
  semesterId: string;
  subject: string;
}

export interface CachedExaminer {
  userId: string;
  displayName: string;
  email: string;
}

/** --- View cho UI danh sách (tổng hợp từ SubmissionEntry + GradeEntry + Exam) --- */

export interface Submission {
  id: string;
  submissionBatchId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: SubmissionEntryStatus;
  /** Tổng điểm (từ rubric hoặc GradeEntry). */
  score?: number;
  gradedBy?: string;
  gradedAt?: string;
  fileUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedExams: number;
  createdAt: string;
}
