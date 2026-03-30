import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { HttpRequestError } from "../../api/http/requestJson";
import {
  examsService,
  submissionBatchesService,
  gradeEntriesService,
  examinerEntriesService,
} from "../../api/services";
import { UserRole } from "../../types/enums";
import { useAuthStore } from "../../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText, Upload, CheckCircle, Clock } from "lucide-react";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const [stats, setStats] = useState(() => [
    {
      title: "Tổng số kỳ thi",
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
  ]);

  const isExaminer = useMemo(() => user?.role === UserRole.Examiner, [user?.role]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    void (async () => {
      try {
        const [exams, batches] = await Promise.all([
          examsService.getExams(),
          submissionBatchesService.getSubmissionBatches(),
        ]);

        const nextStats = [...stats];
        nextStats[0] = { ...nextStats[0], value: String(exams?.length ?? 0) };
        nextStats[1] = { ...nextStats[1], value: String(batches?.length ?? 0) };

        if (isExaminer) {
          const groups = await examinerEntriesService.getMyEntries();
          const allEntries = groups.flatMap((g) => g.entries ?? []);
          const gradedCount = allEntries.filter((e) => e.myGrade != null).length;
          const pendingCount = Math.max(0, allEntries.length - gradedCount);

          nextStats[2] = { ...nextStats[2], value: String(gradedCount) };
          nextStats[3] = { ...nextStats[3], value: String(pendingCount) };
        } else {
          // Với manager/admin: show tổng số grade entries (nếu backend hỗ trợ tổng qua totalItems).
          const res = await gradeEntriesService.getGradeEntries({ pageNumber: 1, pageSize: 1 });
          nextStats[2] = { ...nextStats[2], value: String(res.totalItems ?? 0) };
          nextStats[3] = { ...nextStats[3], value: "--" };
        }

        if (!cancelled) setStats(nextStats);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof HttpRequestError ? err.message : "Không tải được dashboard.";
        toast.error(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isExaminer]);

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
