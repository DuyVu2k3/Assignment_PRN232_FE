import { Link } from "react-router";
import { Button } from "../ui/button";
import { ShieldAlert, LogIn } from "lucide-react";

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center size-20 bg-amber-100 rounded-full mb-6">
          <ShieldAlert className="size-10 text-amber-700" />
        </div>
        <h1 className="text-3xl font-bold mb-2">401 — Phiên đăng nhập không hợp lệ</h1>
        <p className="text-gray-700 mb-8">
          Token hết hạn hoặc không được chấp nhận. Vui lòng đăng nhập lại.
        </p>
        <Link to="/login">
          <Button className="w-full sm:w-auto">
            <LogIn className="size-4 mr-2" />
            Đăng nhập lại
          </Button>
        </Link>
      </div>
    </div>
  );
}
