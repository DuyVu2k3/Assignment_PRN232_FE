import React, { useEffect, useMemo, useState } from "react";
import {
  assignedExaminerService,
  examsService,
  usersService,
  type AssignedExaminerRecord,
  type Exam,
  type UserListItem,
} from "../../../api/services";
import { UserRole } from "../../../types/enums";
import { useAuthStore } from "../../../store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
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

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("vi-VN");
};

export function AssignExaminerByBatchPage() {
  const token = useAuthStore((state) => state.token);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examiners, setExaminers] = useState<UserListItem[]>([]);
  const [assignments, setAssignments] = useState<AssignedExaminerRecord[]>([]);

  const [assignBatchId, setAssignBatchId] = useState("");
  const [assignExaminerId, setAssignExaminerId] = useState("");

  const [filterExamId, setFilterExamId] = useState("");
  const [filterBatchId, setFilterBatchId] = useState("");
  const [filterExaminerId, setFilterExaminerId] = useState("");

  const [isLoadingBaseData, setIsLoadingBaseData] = useState(false);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const assignmentRows = useMemo(() => {
    return assignments
      .map((item) => {
        const exam = exams.find((e) => e.id === item.examId);
        const examiner = examiners.find((u) => u.id === item.examinerId);
        return {
          ...item,
          examTitle: exam?.title ?? `Exam #${item.examId}`,
          examinerName: examiner?.name ?? `User #${item.examinerId}`,
          examinerEmail: examiner?.email ?? "-",
        };
      })
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
  }, [assignments, exams, examiners]);

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được dữ liệu gốc");
    } finally {
      setIsLoadingBaseData(false);
    }
  };

  const loadAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const query: { examId?: number; batchId?: number; examinerId?: number } = {};
      const examId = Number(filterExamId);
      const batchId = Number(filterBatchId);
      const examinerId = Number(filterExaminerId);

      if (Number.isInteger(examId) && examId > 0) {
        query.examId = examId;
      }
      if (Number.isInteger(batchId) && batchId > 0) {
        query.batchId = batchId;
      }
      if (Number.isInteger(examinerId) && examinerId > 0) {
        query.examinerId = examinerId;
      }

      const data = await assignedExaminerService.getAssignedExaminers(query);
      setAssignments(Array.isArray(data) ? data : []);
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
    loadAssignments();
  }, []);

  const handleAssign = async () => {
    const submissionBatchId = Number(assignBatchId);
    const examinerId = Number(assignExaminerId);

    if (!Number.isInteger(submissionBatchId) || submissionBatchId <= 0) {
      toast.error("Vui lòng nhập Batch ID hợp lệ");
      return;
    }
    if (!Number.isInteger(examinerId) || examinerId <= 0) {
      toast.error("Vui lòng chọn examiner");
      return;
    }

    setIsAssigning(true);
    try {
      await assignedExaminerService.assignToBatch({ submissionBatchId, examinerId });
      if (!filterBatchId) {
        setFilterBatchId(String(submissionBatchId));
      }
      await loadAssignments();
      setAssignExaminerId("");
      toast.success("Gán examiner theo batch thành công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gán examiner thất bại");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async (id: number) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn gỡ phân công này?");
    if (!confirmed) {
      return;
    }

    setRemovingId(id);
    try {
      await assignedExaminerService.removeAssignedExaminer(id);
      setAssignments((prev) => prev.filter((item) => item.id !== id));
      toast.success("Đã gỡ phân công");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gỡ phân công thất bại");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Gán examiner theo batch</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo phân công mới</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Batch ID</p>
              <Input
                type="number"
                min={1}
                value={assignBatchId}
                onChange={(e) => setAssignBatchId(e.target.value)}
                placeholder="Nhập submissionBatchId"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Examiner</p>
              <Select value={assignExaminerId} onValueChange={setAssignExaminerId}>
                <SelectTrigger disabled={isLoadingBaseData}>
                  <SelectValue placeholder={isLoadingBaseData ? "Đang tải examiner..." : "Chọn examiner"} />
                </SelectTrigger>
                <SelectContent>
                  {examiners.map((examiner) => (
                    <SelectItem key={examiner.id} value={String(examiner.id)}>
                      {examiner.name} - {examiner.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleAssign} disabled={isAssigning || !assignBatchId || !assignExaminerId}>
              <Plus className="size-4 mr-2" />
              {isAssigning ? "Đang gán..." : "Gán examiner"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc danh sách phân công</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Lọc theo Exam</p>
              <Select value={filterExamId} onValueChange={setFilterExamId}>
                <SelectTrigger disabled={isLoadingBaseData}>
                  <SelectValue placeholder="Tất cả exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả exam</SelectItem>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={String(exam.id)}>
                      {exam.title} (ID: {exam.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Lọc theo Batch ID</p>
              <Input
                type="number"
                min={1}
                value={filterBatchId}
                onChange={(e) => setFilterBatchId(e.target.value)}
                placeholder="Để trống = tất cả"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Lọc theo Examiner</p>
              <Select value={filterExaminerId} onValueChange={setFilterExaminerId}>
                <SelectTrigger disabled={isLoadingBaseData}>
                  <SelectValue placeholder="Tất cả examiner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả examiner</SelectItem>
                  {examiners.map((examiner) => (
                    <SelectItem key={examiner.id} value={String(examiner.id)}>
                      {examiner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (filterExamId === "all") {
                  setFilterExamId("");
                }
                if (filterExaminerId === "all") {
                  setFilterExaminerId("");
                }
                void loadAssignments();
              }}
              disabled={isLoadingAssignments}
            >
              <RefreshCw className="size-4 mr-2" />
              {isLoadingAssignments ? "Đang tải..." : "Tải danh sách"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Danh sách đã gán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Examiner</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>AssignedAt</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignmentRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{row.examTitle}</div>
                    <div className="text-xs text-gray-500">ID: {row.examId}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{row.examinerName}</div>
                    <div className="text-xs text-gray-500">{row.examinerEmail}</div>
                  </TableCell>
                  <TableCell>{row.submissionBatchId}</TableCell>
                  <TableCell>{formatDateTime(row.assignedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemove(row.id)}
                        disabled={removingId === row.id}
                      >
                        <Trash2 className="size-4 mr-1" />
                        {removingId === row.id ? "Đang gỡ..." : "Gỡ"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!isLoadingAssignments && assignmentRows.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Chưa có phân công nào</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
