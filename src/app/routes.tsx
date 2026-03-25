import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layouts/RootLayout";
import { LoginPage } from "./components/pages/LoginPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { ExamListPage } from "./components/pages/ExamListPage";
import { ExamDetailPage } from "./components/pages/ExamDetailPage";
import { CreateExamPage } from "./components/pages/CreateExamPage";
import { SubmissionsPage } from "./components/pages/SubmissionsPage";
import { GradingPage } from "./components/pages/GradingPage";
import { UsersPage } from "./components/pages/UsersPage";
import { NotFoundPage } from "./components/pages/NotFoundPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { RegisterPage } from "./components/pages/RegisterPage";

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
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: DashboardPage },
      { path: "exams", Component: ExamListPage },
      { path: "exams/new", Component: CreateExamPage },
      { path: "exams/:id", Component: ExamDetailPage },
      { path: "submissions", Component: SubmissionsPage },
      { path: "submissions/:id/grade", Component: GradingPage },
      { path: "users", Component: UsersPage },
      { path: "profile", Component: ProfilePage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
