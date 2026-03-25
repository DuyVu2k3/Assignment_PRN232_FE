import { useAuthStore } from "../../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText, Upload, CheckCircle, Clock } from "lucide-react";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const stats = [
    {
      title: "Tổng số đề thi",
      value: "--",
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Tổng bài thi",
      value: "--",
      icon: Upload,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Đã chấm",
      value: "--",
      icon: CheckCircle,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Chờ chấm",
      value: "--",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Chào mừng, {user?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Chưa có dữ liệu hoạt động. Kết nối API hoạt động để hiển thị nội dung.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thống kê theo môn</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Chưa có dữ liệu thống kê môn học. Kết nối API thống kê để hiển thị nội dung.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
