import { useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { HttpRequestError } from "../../api/http/requestJson";
import { registerHttpNavigate } from "../../api/http/httpHandlers";
import { consumePendingHttp401Redirect } from "../../api/http/httpAuthRedirect";
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
  ShieldCheck,
  UploadCloud,
  ListOrdered,
  AlertTriangle,
  BookMarked,
  History,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["Admin", "Manager", "Examiner", "Moderator"] },
  { name: "Exams", href: "/exams", icon: FileText, roles: ["Admin", "Manager"] },
  { name: "Submissions", href: "/submissions", icon: Upload, roles: ["Admin", "Manager", "Examiner"] },
  { name: "Users", href: "/users", icon: Users, roles: ["Admin"] },
  { name: "Vai trò & quyền", href: "/roles", icon: ShieldCheck, roles: ["Admin"] },
  { name: "Học kỳ", href: "/semesters", icon: Calendar, roles: ["Manager"] },
  { name: "Rubric", href: "/rubrics", icon: ClipboardList, roles: ["Manager"] },
  { name: "Gán examiner (đề)", href: "/assign-examiners/exam", icon: UserPlus, roles: ["Manager"] },
  { name: "Gán examiner (batch)", href: "/assign-examiners/batch", icon: Boxes, roles: ["Manager"] },
  { name: "Trạng thái batch", href: "/batches", icon: Activity, roles: ["Manager"] },
  { name: "Báo cáo điểm", href: "/reports/scores", icon: BarChart3, roles: ["Manager"] },
  { name: "Upload batch", href: "/upload-batch", icon: UploadCloud, roles: ["Moderator"] },
  { name: "Theo dõi batch", href: "/moderator/batches", icon: Activity, roles: ["Moderator"] },
  { name: "Entries", href: "/entries", icon: ListOrdered, roles: ["Moderator"] },
  { name: "Vi phạm", href: "/violations", icon: AlertTriangle, roles: ["Moderator"] },
  { name: "Chấm theo batch", href: "/assigned-submissions", icon: BookMarked, roles: ["Examiner"] },
  { name: "Lịch sử chấm", href: "/grading-history", icon: History, roles: ["Examiner"] },
  { name: "Profile", href: "/profile", icon: User, roles: ["Admin", "Manager", "Examiner", "Moderator"] },
];

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

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 p-6 border-b border-gray-200">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <h1 className="font-semibold">Exam System</h1>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="size-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start"
            >
              <LogOut className="size-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
