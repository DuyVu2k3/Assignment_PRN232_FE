import { Link } from "react-router";
import { Button } from "../ui/button";
import { Ban, Home } from "lucide-react";

export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-red-100 p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center size-20 bg-rose-100 rounded-full mb-6">
          <Ban className="size-10 text-rose-700" />
        </div>
        <h1 className="text-3xl font-bold mb-2">403 — Không có quyền truy cập</h1>
        <p className="text-gray-700 mb-8">
          Bạn không được phép thực hiện thao tác này. Nếu cần quyền, hãy liên hệ quản trị viên.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="size-4 mr-2" />
              Về trang chủ
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" className="w-full sm:w-auto">
              Đăng nhập tài khoản khác
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
