export interface Exam {
  id: string;
  title: string;
  subject: string;
  description: string;
  totalPoints: number;
  duration: number;
  createdAt: string;
  status: 'Draft' | 'Active' | 'Archived';
  createdBy: string;
  assignedExaminers: string[];
}

export interface Submission {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'Pending' | 'Grading' | 'Graded';
  score?: number;
  gradedBy?: string;
  gradedAt?: string;
  fileUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Examiner';
  assignedExams: number;
  createdAt: string;
}
