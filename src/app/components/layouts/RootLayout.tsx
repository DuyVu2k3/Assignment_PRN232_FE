import { useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { useAuthStore } from "../../store/authStore";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Users,
  User,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["Admin", "Manager", "Examiner"] },
  { name: "Exams", href: "/exams", icon: FileText, roles: ["Admin", "Manager"] },
  { name: "Submissions", href: "/submissions", icon: Upload, roles: ["Admin", "Manager", "Examiner"] },
  { name: "Users", href: "/users", icon: Users, roles: ["Admin"] },
  { name: "Profile", href: "/profile", icon: User, roles: ["Admin", "Manager", "Examiner"] },
];

export function RootLayout() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user && token) {
      fetchProfile().catch(() => {
        navigate("/login");
      });
      return;
    }

    if (!user && !token) {
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
