import React, { useEffect, useMemo, useState } from "react";
import { HttpRequestError } from "../../../api/http/requestJson";
import { examsService, type Exam } from "../../../api/services";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Card, CardContent } from "../../ui/card";
import { Plus, Search, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { EditExamModal } from "../../modals/EditExamModal";

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
};

export function ExamListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  const [modal, setModal] = useState<
    | null
    | { type: "create" }
    | { type: "edit"; exam: Exam }
  >(null);

  const loadExams = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await examsService.getExams();
      setExams(Array.isArray(data) ? data : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không tải được danh sách kỳ thi";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return exams;
    }

    return exams.filter((exam) => {
      return (
        exam.title.toLowerCase().includes(q) ||
        (exam.semesterName?.toLowerCase().includes(q) ?? false) ||
        String(exam.id).includes(q)
      );
    });
  }, [exams, searchQuery]);

  const sortedExams = useMemo(() => {
    return [...filteredExams].sort((a, b) => {
      const da = new Date(a.createdAt ?? a.dueDate).getTime();
      const db = new Date(b.createdAt ?? b.dueDate).getTime();
      return db - da;
    });
  }, [filteredExams]);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa kỳ thi này?");
    if (!confirmed) {
      return;
    }

    setIsDeletingId(id);
    try {
      await examsService.deleteExam(id);
      setExams((prev) => prev.filter((e) => e.id !== id));

      if (modal?.type === "edit" && modal.exam.id === id) {
        setModal(null);
      }

      toast.success("Xóa kỳ thi thành công");
    } catch (error) {
      toast.error(error instanceof HttpRequestError ? error.message : "Xóa kỳ thi thất bại");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1>Quản lý kỳ thi (Exam)</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadExams} disabled={isLoading}>
            <RefreshCw className="size-4 mr-2" />
            {isLoading ? "Đang tải..." : "Tải lại"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Tìm theo tên kỳ thi, học kỳ hoặc ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="button" onClick={() => setModal({ type: "create" })} className="flex-none">
          <Plus className="size-4 mr-2" />
          Tạo kỳ thi mới
        </Button>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedExams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold">{exam.title}</h3>
                <p className="text-sm text-gray-600 mt-1">Học kỳ: {exam.semesterName ?? `ID ${exam.semesterId}`}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-gray-400" />
                  <span>Hạn nộp: {formatDateTime(exam.dueDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tổng điểm tối đa: </span>
                  <span className="font-medium">{exam.totalMaxScore ?? "-"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModal({ type: "edit", exam })}
                  className="flex-1"
                >
                  Sửa
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(exam.id)}
                  disabled={isDeletingId === exam.id}
                >
                  {isDeletingId === exam.id ? "Đang xóa..." : "Xóa"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedExams.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Chưa có kỳ thi nào</p>
        </div>
      ) : null}

      <EditExamModal
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setModal(null);
          }
        }}
        exam={modal?.type === "edit" ? modal.exam : null}
        onSuccess={(updated, mode) => {
          if (mode === "create") {
            setExams((prev) => [updated, ...prev]);
          } else {
            setExams((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          }
        }}
      />
    </div>
  );
}
