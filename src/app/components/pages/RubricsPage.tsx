import { useEffect, useMemo, useState } from "react";
import { examsService, rubricsService, type Exam, type Rubric } from "../../api/services";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ArrowDown, ArrowUp, ListChecks, Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export function RubricsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [isLoadingRubrics, setIsLoadingRubrics] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [movingRubricId, setMovingRubricId] = useState<number | null>(null);
  const [deletingRubricId, setDeletingRubricId] = useState<number | null>(null);
  const [editingRubricId, setEditingRubricId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState({
    criteria: "",
    maxScore: "",
  });
  const [editForm, setEditForm] = useState({
    criteria: "",
    maxScore: "",
  });

  const selectedExam = useMemo(
    () => exams.find((exam) => String(exam.id) === selectedExamId) ?? null,
    [exams, selectedExamId]
  );

  const sortedRubrics = useMemo(() => {
    return [...rubrics].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [rubrics]);

  const editingRubric = useMemo(
    () => (editingRubricId ? rubrics.find((item) => item.id === editingRubricId) ?? null : null),
    [editingRubricId, rubrics]
  );

  const parsePositiveNumber = (value: string) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      return null;
    }

    return num;
  };

  const loadExams = async () => {
    setIsLoadingExams(true);
    try {
      const data = await examsService.getExams();
      const examList = Array.isArray(data) ? data : [];
      setExams(examList);

      if (!selectedExamId && examList.length > 0) {
        setSelectedExamId(String(examList[0].id));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được danh sách kỳ thi");
    } finally {
      setIsLoadingExams(false);
    }
  };

  const loadRubrics = async (examId: number) => {
    setIsLoadingRubrics(true);
    try {
      const data = await rubricsService.getRubricsByExamId(examId);
      setRubrics(Array.isArray(data) ? data : []);
    } catch (error) {
      setRubrics([]);
      toast.error(error instanceof Error ? error.message : "Không tải được danh sách rubric");
    } finally {
      setIsLoadingRubrics(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    const examId = Number(selectedExamId);
    if (!Number.isInteger(examId) || examId <= 0) {
      setRubrics([]);
      return;
    }

    loadRubrics(examId);
  }, [selectedExamId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const examId = Number(selectedExamId);
    if (!Number.isInteger(examId) || examId <= 0) {
      toast.error("Vui lòng chọn kỳ thi");
      return;
    }

    if (!createForm.criteria.trim()) {
      toast.error("Vui lòng nhập tiêu chí chấm");
      return;
    }

    const maxScore = parsePositiveNumber(createForm.maxScore);
    if (maxScore === null) {
      toast.error("Điểm tối đa phải là số không âm");
      return;
    }

    const nextOrderIndex =
      sortedRubrics.length > 0 ? Math.max(...sortedRubrics.map((item) => item.orderIndex)) + 1 : 0;

    setIsSubmitting(true);
    try {
      const created = await rubricsService.createRubricByExamId(examId, {
        criteria: createForm.criteria.trim(),
        maxScore,
        orderIndex: nextOrderIndex,
      });

      setRubrics((prev) => [...prev, created]);
      setCreateForm({ criteria: "", maxScore: "" });
      toast.success("Tạo rubric thành công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tạo rubric thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (rubric: Rubric) => {
    setEditingRubricId(rubric.id);
    setEditForm({
      criteria: rubric.criteria,
      maxScore: String(rubric.maxScore),
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRubricId) {
      return;
    }

    if (!editForm.criteria.trim()) {
      toast.error("Vui lòng nhập tiêu chí chấm");
      return;
    }

    const maxScore = parsePositiveNumber(editForm.maxScore);
    if (maxScore === null) {
      toast.error("Điểm tối đa phải là số không âm");
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await rubricsService.updateRubric(editingRubricId, {
        criteria: editForm.criteria.trim(),
        maxScore,
        orderIndex: editingRubric?.orderIndex ?? 0,
      });

      setRubrics((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingRubricId(null);
      toast.success("Cập nhật rubric thành công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật rubric thất bại");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (rubricId: number) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa rubric này?");
    if (!confirmed) {
      return;
    }

    setDeletingRubricId(rubricId);
    try {
      await rubricsService.deleteRubric(rubricId);
      setRubrics((prev) => prev.filter((item) => item.id !== rubricId));
      if (editingRubricId === rubricId) {
        setEditingRubricId(null);
      }
      toast.success("Xóa rubric thành công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa rubric thất bại");
    } finally {
      setDeletingRubricId(null);
    }
  };

  const handleMoveRubric = async (rubricId: number, direction: "up" | "down") => {
    const currentIndex = sortedRubrics.findIndex((item) => item.id === rubricId);
    if (currentIndex < 0) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedRubrics.length) {
      return;
    }

    const current = sortedRubrics[currentIndex];
    const target = sortedRubrics[targetIndex];

    setMovingRubricId(rubricId);
    try {
      const [updatedCurrent, updatedTarget] = await Promise.all([
        rubricsService.updateRubric(current.id, {
          criteria: current.criteria,
          maxScore: current.maxScore,
          orderIndex: target.orderIndex,
        }),
        rubricsService.updateRubric(target.id, {
          criteria: target.criteria,
          maxScore: target.maxScore,
          orderIndex: current.orderIndex,
        }),
      ]);

      setRubrics((prev) =>
        prev.map((item) => {
          if (item.id === updatedCurrent.id) {
            return updatedCurrent;
          }
          if (item.id === updatedTarget.id) {
            return updatedTarget;
          }
          return item;
        })
      );

      toast.success("Đã cập nhật thứ tự rubric");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không đổi được thứ tự rubric");
    } finally {
      setMovingRubricId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Rubric - tiêu chí chấm</h1>
        <p className="text-gray-600 mt-1">Manager quản lý rubric bằng API: GET/POST /api/exams/{'{examId}'}/rubrics, PUT/DELETE /api/rubrics/{'{id}'}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-5" />
            Chọn kỳ thi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedExamId} onValueChange={setSelectedExamId}>
            <SelectTrigger disabled={isLoadingExams}>
              <SelectValue placeholder={isLoadingExams ? "Đang tải kỳ thi..." : "Chọn kỳ thi cần quản lý rubric"} />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={String(exam.id)}>
                  {exam.title} (ID: {exam.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Kỳ thi đang chọn: <span className="font-medium text-gray-700">{selectedExam?.title ?? "-"}</span>
            </p>
            <Button
              variant="outline"
              onClick={() => {
                if (!selectedExamId) {
                  return;
                }
                void loadRubrics(Number(selectedExamId));
              }}
              disabled={isLoadingRubrics || !selectedExamId}
            >
              <RefreshCw className="size-4 mr-2" />
              {isLoadingRubrics ? "Đang tải..." : "Tải lại rubric"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tạo rubric mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="criteria">Tiêu chí chấm</Label>
              <Input
                id="criteria"
                value={createForm.criteria}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, criteria: e.target.value }))}
                placeholder="VD: API functionality"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-score">Điểm tối đa</Label>
              <Input
                id="max-score"
                type="number"
                min="0"
                value={createForm.maxScore}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, maxScore: e.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={isSubmitting || !selectedExamId}>
                <Plus className="size-4 mr-2" />
                {isSubmitting ? "Đang tạo..." : "Tạo rubric"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách rubric</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Tiêu chí</TableHead>
                <TableHead>Điểm tối đa</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRubrics.map((rubric, index) => (
                <TableRow key={rubric.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{rubric.criteria}</TableCell>
                  <TableCell>{rubric.maxScore}</TableCell>
                  <TableCell>{rubric.orderIndex}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveRubric(rubric.id, "up")}
                        disabled={index === 0 || movingRubricId === rubric.id}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveRubric(rubric.id, "down")}
                        disabled={index === sortedRubrics.length - 1 || movingRubricId === rubric.id}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleStartEdit(rubric)}>
                        <Pencil className="size-4 mr-1" />
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(rubric.id)}
                        disabled={deletingRubricId === rubric.id}
                      >
                        <Trash2 className="size-4 mr-1" />
                        {deletingRubricId === rubric.id ? "Đang xóa..." : "Xóa"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!isLoadingRubrics && sortedRubrics.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Chưa có rubric cho kỳ thi này</p>
          ) : null}
        </CardContent>
      </Card>

      {editingRubricId ? (
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa rubric (ID: {editingRubricId})</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit-criteria">Tiêu chí chấm</Label>
                <Input
                  id="edit-criteria"
                  value={editForm.criteria}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, criteria: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-max-score">Điểm tối đa</Label>
                <Input
                  id="edit-max-score"
                  type="number"
                  min="0"
                  value={editForm.maxScore}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, maxScore: e.target.value }))}
                  required
                />
              </div>

              <div className="md:col-span-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingRubricId(null)}>
                  <X className="size-4 mr-2" />
                  Hủy
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  <Save className="size-4 mr-2" />
                  {isUpdating ? "Đang lưu..." : "Lưu cập nhật"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
