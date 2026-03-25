import { Link } from "react-router";
import { Button } from "../ui/button";
import { FileQuestion, Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center size-20 bg-blue-100 rounded-full mb-6">
          <FileQuestion className="size-10 text-blue-600" />
        </div>
        <h1 className="text-4xl mb-4">404</h1>
        <h2 className="mb-2">Không tìm thấy trang</h2>
        <p className="text-gray-600 mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <Link to="/">
          <Button>
            <Home className="size-4 mr-2" />
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
