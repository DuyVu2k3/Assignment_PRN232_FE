import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { examsService, semestersService, type Semester } from "../../../api/services";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function CreateExamPage() {
  const navigate = useNavigate();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    dueDate: "",
    semesterId: "",
  });

  useEffect(() => {
    const loadSemesters = async () => {
      setIsLoadingSemesters(true);
      try {
        const data = await semestersService.getSemesters();
        setSemesters(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không tải được danh sách học kỳ");
      } finally {
        setIsLoadingSemesters(false);
      }
    };

    loadSemesters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.dueDate || !formData.semesterId) {
      toast.error("Vui lòng nhập đầy đủ thông tin kỳ thi");
      return;
    }

    const semesterId = Number(formData.semesterId);
    if (!Number.isInteger(semesterId) || semesterId <= 0) {
      toast.error("Học kỳ không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      await examsService.createExam({
        title: formData.title.trim(),
        dueDate: new Date(formData.dueDate).toISOString(),
        semesterId,
      });

      toast.success("Tạo kỳ thi thành công");
      navigate("/exams");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tạo kỳ thi thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/exams">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1>Tạo kỳ thi mới (Exam)</h1>
          <p className="text-gray-600 mt-1">Manager tạo kỳ thi từ API POST /api/exams</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin kỳ thi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Tên kỳ thi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="VD: PE PRN232 - SU26"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semesterId">
                Học kỳ <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.semesterId}
                onValueChange={(value) =>
                  setFormData({ ...formData, semesterId: value })
                }
              >
                <SelectTrigger id="semesterId" disabled={isLoadingSemesters}>
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
              <Label htmlFor="dueDate">
                Hạn nộp <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <Button type="submit" disabled={isSubmitting || isLoadingSemesters}>
                {isSubmitting ? "Đang tạo..." : "Tạo kỳ thi"}
              </Button>
              <Link to="/exams">
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
