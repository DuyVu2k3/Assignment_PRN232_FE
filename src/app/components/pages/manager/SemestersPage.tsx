import React, { useEffect, useMemo, useState } from "react";
import { HttpRequestError } from "../../../api/http/requestJson";
import { Semester, semestersService } from "../../../api/services";
import { EditSemesterModal } from "../../modals/EditSemesterModal";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

type SemesterModalState =
  | null
  | { type: "create" }
  | { type: "edit"; semester: Semester };

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("vi-VN");
};

export function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modal, setModal] = useState<SemesterModalState>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  const sortedSemesters = useMemo(() => {
    return [...semesters].sort((a, b) => {
      const da = new Date(a.startDate).getTime();
      const db = new Date(b.startDate).getTime();
      return db - da;
    });
  }, [semesters]);

  const loadSemesters = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await semestersService.getSemesters();
      setSemesters(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error instanceof HttpRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Không tải được danh sách học kỳ";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSemesters();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa học kỳ này?");
    if (!confirmed) {
      return;
    }

    setIsDeletingId(id);
    try {
      await semestersService.deleteSemester(id);
      setSemesters((prev) => prev.filter((item) => item.id !== id));
      if (modal?.type === "edit" && modal.semester.id === id) {
        setModal(null);
      }
      toast.success("Xóa học kỳ thành công");
    } catch (error) {
      toast.error(error instanceof HttpRequestError ? error.message : "Xóa học kỳ thất bại");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Quản lý Học kỳ</h1>
        </div>
        <Button variant="outline" onClick={loadSemesters} disabled={isLoading}>
          <RefreshCw className="size-4 mr-2" />
          {isLoading ? "Đang tải..." : "Tải lại"}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-4">
          <CardTitle className="text-xl">Danh sách học kỳ</CardTitle>
          <Button type="button" onClick={() => setModal({ type: "create" })}>
            <Plus className="size-4 mr-2" />
            Tạo học kỳ
          </Button>
        </CardHeader>
        <CardContent>
          {errorMessage ? <p className="text-sm text-red-600 mb-3">{errorMessage}</p> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tên học kỳ</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
                <TableHead>Ngày kết thúc</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSemesters.map((semester) => (
                <TableRow key={semester.id}>
                  <TableCell>{semester.id}</TableCell>
                  <TableCell className="font-medium">{semester.name}</TableCell>
                  <TableCell>{formatDate(semester.startDate)}</TableCell>
                  <TableCell>{formatDate(semester.endDate)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setModal({ type: "edit", semester })}
                      >
                        <Pencil className="size-4 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(semester.id)}
                        disabled={isDeletingId === semester.id}
                      >
                        <Trash2 className="size-4 mr-1" />
                        {isDeletingId === semester.id ? "Đang xóa..." : "Xóa"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {sortedSemesters.length === 0 && !isLoading ? (
            <p className="text-sm text-gray-500 text-center py-6">Chưa có học kỳ nào</p>
          ) : null}
        </CardContent>
      </Card>

      <EditSemesterModal
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) {
            setModal(null);
          }
        }}
        semester={modal?.type === "edit" ? modal.semester : null}
        onSuccess={(s, mode) => {
          if (mode === "create") {
            setSemesters((prev) => [s, ...prev]);
          } else {
            setSemesters((prev) => prev.map((item) => (item.id === s.id ? s : item)));
          }
        }}
      />
    </div>
  );
}
