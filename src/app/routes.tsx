import { type ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import { UserRole } from "./types/enums";
import { RequireRoles } from "./components/auth/RequireRoles";
import { RootLayout } from "./components/layouts/RootLayout";
import { LoginPage } from "./components/pages/LoginPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { ExamListPage } from "./components/pages/manager/ExamListPage";
import { ExamDetailPage } from "./components/pages/manager/ExamDetailPage";
import { CreateExamPage } from "./components/pages/manager/CreateExamPage";
import { SubmissionsPage } from "./components/pages/SubmissionsPage";
import { GradingPage } from "./components/pages/GradingPage";
import { BatchGradingPage } from "./components/pages/BatchGradingPage";
import { UsersPage } from "./components/pages/admin/UsersPage";
import { NotFoundPage } from "./components/pages/NotFoundPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { RegisterPage } from "./components/pages/RegisterPage";
import { SemestersPage } from "./components/pages/manager/SemestersPage";
import { RubricsPage } from "./components/pages/manager/RubricsPage";
import { AssignExaminerByExamPage } from "./components/pages/manager/AssignExaminerByExamPage";
import { AssignExaminerByBatchPage } from "./components/pages/manager/AssignExaminerByBatchPage";
import { BatchesStatusPage } from "./components/pages/manager/BatchesStatusPage";
import { ScoreReportsPage } from "./components/pages/manager/ScoreReportsPage";
import { UploadBatchPage } from "./components/pages/moderator/UploadBatchPage";
import { ModeratorBatchTrackingPage } from "./components/pages/moderator/ModeratorBatchTrackingPage";
import { EntriesPage } from "./components/pages/moderator/EntriesPage";
import { ViolationsPage } from "./components/pages/moderator/ViolationsPage";
import { AssignedSubmissionsPage } from "./components/pages/examiner/AssignedSubmissionsPage";
import { ExaminerEntryGradingPage } from "./components/pages/examiner/ExaminerEntryGradingPage";
import { GradingHistoryPage } from "./components/pages/examiner/GradingHistoryPage";
import { UnauthorizedPage } from "./components/pages/UnauthorizedPage";
import { ForbiddenPage } from "./components/pages/ForbiddenPage";

const R = {
  admin: [UserRole.Admin] as const satisfies readonly UserRole[],
  manager: [UserRole.Manager] as const satisfies readonly UserRole[],
  moderator: [UserRole.Moderator] as const satisfies readonly UserRole[],
  examiner: [UserRole.Examiner] as const satisfies readonly UserRole[],
  exams: [UserRole.Admin, UserRole.Manager] as const satisfies readonly UserRole[],
  submissions: [UserRole.Admin, UserRole.Manager, UserRole.Examiner] as const satisfies readonly UserRole[],
};

function withRoles(roles: readonly UserRole[], Page: ComponentType) {
  return (
    <RequireRoles roles={roles}>
      <Page />
    </RequireRoles>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/unauthorized",
    Component: UnauthorizedPage,
  },
  {
    path: "/forbidden",
    Component: ForbiddenPage,
  },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "exams", element: withRoles(R.exams, ExamListPage) },
      { path: "exams/new", element: withRoles(R.exams, CreateExamPage) },
      { path: "exams/:id", element: withRoles(R.exams, ExamDetailPage) },
      { path: "submissions", element: withRoles(R.submissions, SubmissionsPage) },
      { path: "submissions/:id/grade", element: withRoles(R.submissions, GradingPage) },
      { path: "batches/:batchId/grade", element: withRoles(R.submissions, BatchGradingPage) },
      { path: "users", element: withRoles(R.admin, UsersPage) },
      { path: "profile", Component: ProfilePage },
      { path: "semesters", element: withRoles(R.manager, SemestersPage) },
      { path: "rubrics", element: withRoles(R.manager, RubricsPage) },
      { path: "assign-examiners/exam", element: withRoles(R.manager, AssignExaminerByExamPage) },
      { path: "assign-examiners/batch", element: withRoles(R.manager, AssignExaminerByBatchPage) },
      { path: "batches", element: withRoles(R.manager, BatchesStatusPage) },
      { path: "reports/scores", element: withRoles(R.manager, ScoreReportsPage) },
      { path: "upload-batch", element: withRoles(R.moderator, UploadBatchPage) },
      { path: "moderator/batches", element: withRoles(R.moderator, ModeratorBatchTrackingPage) },
      { path: "entries", element: withRoles(R.moderator, EntriesPage) },
      { path: "violations", element: withRoles(R.moderator, ViolationsPage) },
      { path: "assigned-submissions", element: withRoles(R.examiner, AssignedSubmissionsPage) },
      {
        path: "assigned-submissions/entries/:entryId/grade",
        element: withRoles(R.examiner, ExaminerEntryGradingPage),
      },
      { path: "grading-history", element: withRoles(R.examiner, GradingHistoryPage) },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
