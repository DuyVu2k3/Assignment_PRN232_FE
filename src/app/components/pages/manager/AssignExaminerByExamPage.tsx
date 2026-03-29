import { useEffect, useMemo, useState } from "react";
import {
  examExaminersService,
  examsService,
  usersService,
  type Exam,
  type ExamExaminerAssignment,
  type UserListItem,
} from "../../../api/services";
import { UserRole } from "../../../types/enums";
import { useAuthStore } from "../../../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Plus, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function AssignExaminerByExamPage() {
  const token = useAuthStore((state) => state.token);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examiners, setExaminers] = useState<UserListItem[]>([]);
  const [assignments, setAssignments] = useState<ExamExaminerAssignment[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedExaminerId, setSelectedExaminerId] = useState<string>("");
  const [isLoadingBaseData, setIsLoadingBaseData] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  const selectedExam = useMemo(
    () => exams.find((exam) => String(exam.id) === selectedExamId) ?? null,
    [exams, selectedExamId]
  );

  const assignmentRows = useMemo(() => {
    return assignments
      .map((item) => {
        const examiner = examiners.find((u) => u.id === item.userId);
        return {
          ...item,
          examinerName: examiner?.name ?? `User #${item.userId}`,
          examinerEmail: examiner?.email ?? "-",
        };
      })
      .sort((a, b) => a.examinerName.localeCompare(b.examinerName));
  }, [assignments, examiners]);

  const availableExaminers = useMemo(() => {
    const assignedIds = new Set(assignments.map((item) => item.userId));
    return examiners.filter((item) => !assignedIds.has(item.id));
  }, [assignments, examiners]);

  const loadBaseData = async () => {
    setIsLoadingBaseData(true);
    try {
      const [examsResult, usersResult] = await Promise.all([
        examsService.getExams(),
        usersService.getUsers({ pageNumber: 1, pageSize: 100, token: token ?? undefined }),
      ]);

      const examList = Array.isArray(examsResult) ? examsResult : [];
      setExams(examList);
      setExaminers((usersResult.data ?? []).filter((item) => item.role === UserRole.Examiner));

      if (!selectedExamId && examList.length > 0) {
        setSelectedExamId(String(examList[0].id));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được dữ liệu gốc");
    } finally {
      setIsLoadingBaseData(false);
    }
  };

  const loadAssignments = async (examId: number) => {
    setIsLoadingAssignments(true);
    try {
      const result = await examExaminersService.getByExamId(examId);
      setAssignments(result);
    } catch (error) {
      setAssignments([]);
      toast.error(error instanceof Error ? error.message : "Không tải được danh sách phân công");
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, [token]);

  useEffect(() => {
    const examId = Number(selectedExamId);
    if (!Number.isInteger(examId) || examId <= 0) {
      setAssignments([]);
      return;
    }

    setSelectedExaminerId("");
    loadAssignments(examId);
  }, [selectedExamId]);

  const handleAssign = async () => {
    const examId = Number(selectedExamId);
    const userId = Number(selectedExaminerId);

    if (!Number.isInteger(examId) || examId <= 0) {
      toast.error("Vui lòng chọn kỳ thi");
      return;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      toast.error("Vui lòng chọn examiner");
      return;
    }

    setIsAssigning(true);
    try {
      const assigned = await examExaminersService.assign(examId, userId);
      setAssignments((prev) => {
        if (prev.some((item) => item.userId === assigned.userId)) {
          return prev;
        }
        return [...prev, assigned];
      });
      setSelectedExaminerId("");
      toast.success("Gán examiner thành công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gán examiner thất bại");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async (userId: number) => {
    const examId = Number(selectedExamId);
    if (!Number.isInteger(examId) || examId <= 0) {
      return;
    }

    const confirmed = window.confirm("Bạn có chắc chắn muốn gỡ examiner khỏi kỳ thi này?");
    if (!confirmed) {
      return;
    }

    setRemovingUserId(userId);
    try {
      await examExaminersService.remove(examId, userId);
      setAssignments((prev) => prev.filter((item) => item.userId !== userId));
      toast.success("Đã gỡ examiner khỏi kỳ thi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gỡ examiner thất bại");
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Gán examiner theo đề</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chọn kỳ thi và gán examiner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Kỳ thi</p>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger disabled={isLoadingBaseData}>
                  <SelectValue placeholder={isLoadingBaseData ? "Đang tải kỳ thi..." : "Chọn kỳ thi"} />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={String(exam.id)}>
                      {exam.title} (ID: {exam.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Examiner</p>
              <Select value={selectedExaminerId} onValueChange={setSelectedExaminerId}>
                <SelectTrigger disabled={!selectedExamId || isLoadingBaseData}>
                  <SelectValue placeholder="Chọn examiner để gán" />
                </SelectTrigger>
                <SelectContent>
                  {availableExaminers.map((examiner) => (
                    <SelectItem key={examiner.id} value={String(examiner.id)}>
                      {examiner.name} - {examiner.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-gray-500">
              Kỳ thi đang chọn: <span className="font-medium text-gray-700">{selectedExam?.title ?? "-"}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const examId = Number(selectedExamId);
                  if (!Number.isInteger(examId) || examId <= 0) {
                    return;
                  }
                  void loadAssignments(examId);
                }}
                disabled={!selectedExamId || isLoadingAssignments}
              >
                <RefreshCw className="size-4 mr-2" />
                {isLoadingAssignments ? "Đang tải..." : "Tải lại"}
              </Button>
              <Button onClick={handleAssign} disabled={!selectedExamId || !selectedExaminerId || isAssigning}>
                <Plus className="size-4 mr-2" />
                {isAssigning ? "Đang gán..." : "Gán examiner"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Danh sách examiner đã gán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>STT</TableHead>
                <TableHead>Tên examiner</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignmentRows.map((row, index) => (
                <TableRow key={`${row.examId}-${row.userId}`}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{row.examinerName}</TableCell>
                  <TableCell>{row.examinerEmail}</TableCell>
                  <TableCell>{row.userId}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemove(row.userId)}
                        disabled={removingUserId === row.userId}
                      >
                        <Trash2 className="size-4 mr-1" />
                        {removingUserId === row.userId ? "Đang gỡ..." : "Gỡ"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!isLoadingAssignments && assignmentRows.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Kỳ thi này chưa có examiner nào được gán</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
