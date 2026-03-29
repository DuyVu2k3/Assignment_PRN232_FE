import { useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { HttpRequestError } from "../../api/http/requestJson";
import { registerHttpNavigate } from "../../api/http/httpHandlers";
import { consumePendingHttp401Redirect } from "../../api/http/httpAuthRedirect";
import { UserRole } from "../../types/enums";
import { useAuthStore } from "../../store/authStore";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Users,
  User,
  LogOut,
  GraduationCap,
  Calendar,
  ClipboardList,
  UserPlus,
  Boxes,
  Activity,
  BarChart3,
  UploadCloud,
  ListOrdered,
  AlertTriangle,
  History,
  KeyRound,
  Inbox,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: readonly UserRole[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const ALL_APP_ROLES = [
  UserRole.Admin,
  UserRole.Manager,
  UserRole.Examiner,
  UserRole.Moderator,
] as const;

/** Menu theo checklist: Chung → Admin → Manager → Moderator → Examiner */
const navSections: NavSection[] = [
  {
    title: "Chung",
    items: [
      {
        name: "Tổng quan",
        href: "/",
        icon: LayoutDashboard,
        roles: ALL_APP_ROLES,
      },
      {
        name: "Hồ sơ cá nhân",
        href: "/profile",
        icon: User,
        roles: ALL_APP_ROLES,
      },
      {
        name: "Đổi mật khẩu",
        href: "/profile?tab=security",
        icon: KeyRound,
        roles: ALL_APP_ROLES,
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        name: "Quản lý người dùng",
        href: "/users",
        icon: Users,
        roles: [UserRole.Admin],
      },
    ],
  },
  {
    title: "Manager",
    items: [
      {
        name: "Bài nộp (tổng hợp)",
        href: "/submissions",
        icon: Inbox,
        roles: [UserRole.Admin, UserRole.Manager],
      },
      {
        name: "Học kỳ (Semesters)",
        href: "/semesters",
        icon: Calendar,
        roles: [UserRole.Manager],
      },
      {
        name: "Kỳ thi (Exams)",
        href: "/exams",
        icon: FileText,
        roles: [UserRole.Manager],
      },
      {
        name: "Rubric",
        href: "/rubrics",
        icon: ClipboardList,
        roles: [UserRole.Manager],
      },
      {
        name: "Gán examiner theo kỳ thi",
        href: "/assign-examiners/exam",
        icon: UserPlus,
        roles: [UserRole.Manager],
      },
      {
        name: "Gán examiner theo batch",
        href: "/assign-examiners/batch",
        icon: Boxes,
        roles: [UserRole.Manager],
      },
      {
        name: "Trạng thái batch",
        href: "/batches",
        icon: Activity,
        roles: [UserRole.Manager],
      },
      {
        name: "Báo cáo điểm",
        href: "/reports/scores",
        icon: BarChart3,
        roles: [UserRole.Manager],
      },
    ],
  },
  {
    title: "Moderator",
    items: [
      {
        name: "Upload batch",
        href: "/upload-batch",
        icon: UploadCloud,
        roles: [UserRole.Moderator],
      },
      {
        name: "Theo dõi xử lý batch",
        href: "/moderator/batches",
        icon: Activity,
        roles: [UserRole.Moderator],
      },
      {
        name: "Bài nộp (Entries)",
        href: "/entries",
        icon: ListOrdered,
        roles: [UserRole.Moderator],
      },
      {
        name: "Vi phạm & asset",
        href: "/violations",
        icon: AlertTriangle,
        roles: [UserRole.Moderator],
      },
    ],
  },
  {
    title: "Examiner",
    items: [
      {
        name: "Phân công & chấm (rubric)",
        href: "/assigned-submissions",
        icon: NotebookPen,
        roles: [UserRole.Examiner],
      },
      {
        name: "Lịch sử chấm / xem điểm",
        href: "/grading-history",
        icon: History,
        roles: [UserRole.Examiner],
      },
    ],
  },
];

function isNavItemActive(href: string, pathname: string, search: string): boolean {
  const q = href.indexOf("?");
  const path = q === -1 ? href : href.slice(0, q);
  const queryPart = q === -1 ? "" : href.slice(q + 1);

  if (pathname !== path) return false;

  if (!queryPart) {
    if (path === "/profile") {
      const t = new URLSearchParams(search).get("tab");
      return t !== "security";
    }
    return true;
  }

  const want = new URLSearchParams(queryPart);
  const have = new URLSearchParams(search);
  for (const [k, v] of want.entries()) {
    if (have.get(k) !== v) return false;
  }
  return true;
}

export function RootLayout() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    registerHttpNavigate((path) => navigate(path, { replace: true }));
  }, [navigate]);

  useEffect(() => {
    if (!user && token) {
      fetchProfile().catch((err) => {
        if (err instanceof HttpRequestError && err.status === 401) {
          return;
        }
        if (err instanceof HttpRequestError && err.status === 403) {
          navigate("/forbidden");
          return;
        }
        navigate("/login");
      });
      return;
    }

    if (!user && !token) {
      if (consumePendingHttp401Redirect()) {
        return;
      }
      navigate("/login");
    }
  }, [user, token, fetchProfile, navigate]);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="flex items-center gap-2 p-6 border-b border-gray-200 shrink-0">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <h1 className="font-semibold">Exam System</h1>
            <p className="text-sm text-gray-500">{user.role}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {navSections.map((section) => {
            const items = section.items.filter((item) => item.roles.includes(user.role));
            if (items.length === 0) return null;
            return (
              <div key={section.title}>
                <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const active = isNavItemActive(
                      item.href,
                      location.pathname,
                      location.search
                    );
                    return (
                      <Link
                        key={`${section.title}-${item.name}-${item.href}`}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                          active
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <item.icon className="size-5 shrink-0" />
                        <span className="leading-snug">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 shrink-0">
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="w-full justify-start">
            <LogOut className="size-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </div>

      <div className="pl-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
