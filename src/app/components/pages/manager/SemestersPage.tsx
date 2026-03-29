import { useEffect, useMemo, useState } from "react";
import { Semester, semestersService } from "../../../api/services";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Eye, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [editingSemesterId, setEditingSemesterId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

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
      const message = error instanceof Error ? error.message : "Không tải được danh sách học kỳ";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSemesters();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Vui lòng nhập đầy đủ thông tin học kỳ");
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await semestersService.createSemester({
        name: formData.name,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      });

      setSemesters((prev) => [created, ...prev]);
      setFormData({ name: "", startDate: "", endDate: "" });
      toast.success("Tạo học kỳ thành công");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tạo học kỳ thất bại";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = async (id: number) => {
    setIsLoadingDetail(true);
    try {
      const detail = await semestersService.getSemesterById(id);
      setSelectedSemester(detail);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không xem được chi tiết học kỳ");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleStartEdit = (semester: Semester) => {
    setEditingSemesterId(semester.id);
    setEditForm({
      name: semester.name,
      startDate: semester.startDate.slice(0, 10),
      endDate: semester.endDate.slice(0, 10),
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingSemesterId) {
      return;
    }

    if (!editForm.name || !editForm.startDate || !editForm.endDate) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (new Date(editForm.endDate) < new Date(editForm.startDate)) {
      toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await semestersService.updateSemester(editingSemesterId, {
        name: editForm.name,
        startDate: new Date(editForm.startDate).toISOString(),
        endDate: new Date(editForm.endDate).toISOString(),
      });

      setSemesters((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (selectedSemester?.id === updated.id) {
        setSelectedSemester(updated);
      }
      setEditingSemesterId(null);
      toast.success("Cập nhật học kỳ thành công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật học kỳ thất bại");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa học kỳ này?");
    if (!confirmed) {
      return;
    }

    setIsDeletingId(id);
    try {
      await semestersService.deleteSemester(id);
      setSemesters((prev) => prev.filter((item) => item.id !== id));
      if (selectedSemester?.id === id) {
        setSelectedSemester(null);
      }
      if (editingSemesterId === id) {
        setEditingSemesterId(null);
      }
      toast.success("Xóa học kỳ thành công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa học kỳ thất bại");
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Quản lý Học kỳ</h1>
          <p className="text-gray-600 mt-1">Manager tạo và xem danh sách học kỳ từ API /api/semesters</p>
        </div>
        <Button variant="outline" onClick={loadSemesters} disabled={isLoading}>
          <RefreshCw className="size-4 mr-2" />
          {isLoading ? "Đang tải..." : "Tải lại"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo học kỳ mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="semester-name">Tên học kỳ</Label>
              <Input
                id="semester-name"
                placeholder="VD: Spring 2026"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester-start">Ngày bắt đầu</Label>
              <Input
                id="semester-start"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester-end">Ngày kết thúc</Label>
              <Input
                id="semester-end"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>

            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Plus className="size-4 mr-2" />
                {isSubmitting ? "Đang tạo..." : "Tạo học kỳ"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách học kỳ</CardTitle>
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
                      <Button variant="outline" size="sm" onClick={() => handleViewDetail(semester.id)}>
                        <Eye className="size-4 mr-1" />
                        Chi tiết
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleStartEdit(semester)}>
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

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết học kỳ</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingDetail ? (
            <p className="text-sm text-gray-500">Đang tải chi tiết...</p>
          ) : selectedSemester ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">ID</p>
                <p className="font-medium">{selectedSemester.id}</p>
              </div>
              <div>
                <p className="text-gray-500">Tên học kỳ</p>
                <p className="font-medium">{selectedSemester.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Ngày bắt đầu - kết thúc</p>
                <p className="font-medium">
                  {formatDate(selectedSemester.startDate)} - {formatDate(selectedSemester.endDate)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Chọn một học kỳ và bấm "Chi tiết" để xem.</p>
          )}
        </CardContent>
      </Card>

      {editingSemesterId ? (
        <Card>
          <CardHeader>
            <CardTitle>Cập nhật học kỳ (ID: {editingSemesterId})</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit-name">Tên học kỳ</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-start">Ngày bắt đầu</Label>
                <Input
                  id="edit-start"
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end">Ngày kết thúc</Label>
                <Input
                  id="edit-end"
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
              <div className="md:col-span-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingSemesterId(null)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Đang cập nhật..." : "Lưu cập nhật"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
