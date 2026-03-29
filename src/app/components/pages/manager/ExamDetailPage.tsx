import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { examsService, semestersService, type Exam, type Semester } from "../../../api/services";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { ArrowLeft, Calendar, Pencil, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const formatDateTime = (value: string | undefined) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("vi-VN");
};

const toDateTimeLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export function ExamDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const examId = Number(id);
  const [exam, setExam] = useState<Exam | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    dueDate: "",
    semesterId: "",
  });

  const selectedSemesterName = useMemo(() => {
    if (!exam) {
      return "-";
    }

    const fromList = semesters.find((s) => s.id === exam.semesterId)?.name;
    return exam.semesterName ?? fromList ?? `ID ${exam.semesterId}`;
  }, [exam, semesters]);

  const syncEditForm = (currentExam: Exam) => {
    setFormData({
      title: currentExam.title,
      dueDate: toDateTimeLocal(currentExam.dueDate),
      semesterId: String(currentExam.semesterId),
    });
  };

  const loadExam = async () => {
    if (!Number.isInteger(examId) || examId <= 0) {
      return;
    }

    setIsLoading(true);
    try {
      const detail = await examsService.getExamById(examId);
      setExam(detail);
      syncEditForm(detail);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được kỳ thi");
      setExam(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSemesters = async () => {
    setIsLoadingSemesters(true);
    try {
      const data = await semestersService.getSemesters();
      setSemesters(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được học kỳ");
    } finally {
      setIsLoadingSemesters(false);
    }
  };

  useEffect(() => {
    loadSemesters();
    loadExam();
  }, [id]);

  if (!Number.isInteger(examId) || examId <= 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ID kỳ thi không hợp lệ</p>
        <Link to="/exams">
          <Button variant="outline" className="mt-4">
            Quay lại
          </Button>
        </Link>
      </div>
    );
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!exam) {
      return;
    }

    if (!formData.title || !formData.dueDate || !formData.semesterId) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const semesterId = Number(formData.semesterId);
    if (!Number.isInteger(semesterId) || semesterId <= 0) {
      toast.error("Học kỳ không hợp lệ");
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await examsService.updateExam(exam.id, {
        title: formData.title.trim(),
        dueDate: new Date(formData.dueDate).toISOString(),
        semesterId,
      });

      setExam(updated);
      syncEditForm(updated);
      setIsEditMode(false);
      toast.success("Cập nhật kỳ thi thành công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật kỳ thi thất bại");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!exam) {
      return;
    }

    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa kỳ thi này?");
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await examsService.deleteExam(exam.id);
      toast.success("Xóa kỳ thi thành công");
      navigate("/exams");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa kỳ thi thất bại");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/exams">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1>{exam?.title ?? "Chi tiết kỳ thi"}</h1>
          <p className="text-gray-600 mt-1">Manager xem/cập nhật/xóa kỳ thi qua API /api/exams/{'{id}'}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <Button variant="outline" onClick={() => exam && setIsEditMode(true)} disabled={!exam || isLoading}>
              <Pencil className="size-4 mr-2" />
              Chỉnh sửa
            </Button>
          ) : (
            <Button variant="outline" onClick={() => exam && (setIsEditMode(false), syncEditForm(exam))}>
              <X className="size-4 mr-2" />
              Hủy sửa
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete} disabled={!exam || isDeleting || isLoading}>
            <Trash2 className="size-4 mr-2" />
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-gray-500">Đang tải chi tiết kỳ thi...</p> : null}

      {!isLoading && !exam ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy kỳ thi</p>
          <Link to="/exams">
            <Button variant="outline" className="mt-4">
              Quay lại
            </Button>
          </Link>
        </div>
      ) : null}

      {!isLoading && exam ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin kỳ thi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">ID</p>
                  <p className="font-medium">{exam.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Học kỳ</p>
                  <p className="font-medium">{selectedSemesterName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Hạn nộp</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-gray-400" />
                    <p className="font-medium">{formatDateTime(exam.dueDate)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Tổng điểm tối đa</p>
                  <p className="font-medium">{exam.totalMaxScore ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Người tạo (User ID)</p>
                  <p className="font-medium">{exam.createdByUserId ?? "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Ngày tạo</p>
                  <p className="font-medium">{formatDateTime(exam.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cập nhật kỳ thi</CardTitle>
            </CardHeader>
            <CardContent>
              {!isEditMode ? (
                <p className="text-sm text-gray-500">Bấm "Chỉnh sửa" để cập nhật thông tin kỳ thi.</p>
              ) : (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Tên kỳ thi</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-semester">Học kỳ</Label>
                    <Select
                      value={formData.semesterId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, semesterId: value }))}
                    >
                      <SelectTrigger id="edit-semester" disabled={isLoadingSemesters}>
                        <SelectValue placeholder={isLoadingSemesters ? "Đang tải học kỳ..." : "Chọn học kỳ"} />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((semester) => (
                          <SelectItem key={semester.id} value={String(semester.id)}>
                            {semester.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-due-date">Hạn nộp</Label>
                    <Input
                      id="edit-due-date"
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isUpdating}>
                    <Save className="size-4 mr-2" />
                    {isUpdating ? "Đang cập nhật..." : "Lưu cập nhật"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
