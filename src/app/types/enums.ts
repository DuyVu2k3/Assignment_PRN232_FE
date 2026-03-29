/** Vai trò người dùng — khớp giá trị chuỗi từ API / JWT. */
export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  Examiner = 'Examiner',
  Moderator = 'Moderator',
}

export enum ExamStatus {
  Draft = 'Draft',
  Active = 'Active',
  Archived = 'Archived',
}

export enum SubmissionBatchStatus {
  PendingExtraction = 'PendingExtraction',
  Extracting = 'Extracting',
  Ready = 'Ready',
  Failed = 'Failed',
}

/** Trạng thái pipeline batch từ API /submission-batches (số). */
export enum SubmissionBatchPipelineStatus {
  PendingExtraction = 0,
  Processing = 1,
  Completed = 2,
  Failed = 3,
}

/** Trạng thái entry / hiển thị bài trên UI chấm điểm. */
export enum SubmissionEntryStatus {
  Pending = 'Pending',
  Grading = 'Grading',
  Graded = 'Graded',
}

export enum SubmissionAssetKind {
  Image = 'image',
  Code = 'code',
  Document = 'document',
  Other = 'other',
}

export enum ViolationSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}
