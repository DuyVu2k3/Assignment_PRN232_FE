import { Link } from "react-router";
import {
  formatExamPeriod,
  getBatchesForExaminer,
  getEntriesForBatch,
  getSubmissionFileById,
  getRubricsForExam,
  mockExams,
} from "../../data/mockData";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ClipboardList, Table2 } from "lucide-react";

export function AssignedSubmissionsPage() {
  const user = useAuthStore((s) => s.user);
  const uid = user ? String(user.id) : "";
  const batches = uid ? getBatchesForExaminer(uid) : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Table2 className="size-7 text-muted-foreground" />
          Danh sách bài được phân — chấm (rubric)
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Bước 1: chọn batch. Bước 2: bảng điểm có cột <strong>StudentCode</strong> và các tiêu chí do{" "}
          <strong>Manager</strong> cấu hình. Nhập điểm như Excel (Tab), rồi <strong>Lưu điểm</strong>.
        </p>
      </div>

      {!user ? (
        <p className="text-sm text-muted-foreground">Đang tải thông tin đăng nhập…</p>
      ) : batches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chưa có batch được phân</CardTitle>
            <CardDescription>
              Khi Manager gán bạn cho một batch hoặc cho cả kỳ thi, batch sẽ hiện ở đây (mock: kiểm tra{" "}
              <span className="font-mono">mockAssignedExaminers</span> và user id khớp examiner).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="size-5" />
              Batch của bạn
            </CardTitle>
            <CardDescription>Chọn batch để mở bảng điểm theo rubric.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Kỳ thi</TableHead>
                  <TableHead>Tiêu chí</TableHead>
                  <TableHead>File nộp</TableHead>
                  <TableHead>Số SV</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => {
                  const exam = mockExams.find((e) => e.id === b.examId);
                  const file = getSubmissionFileById(b.submissionFileId);
                  const entries = getEntriesForBatch(b.id);
                  const rubricCount = exam ? getRubricsForExam(exam.id).length : 0;
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono">{b.id}</TableCell>
                      <TableCell>
                        {exam ? (
                          <>
                            <span className="font-medium">{exam.title}</span>
                            <span className="block text-xs text-muted-foreground">
                              {formatExamPeriod(exam)}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rubricCount > 0 ? `${rubricCount} tiêu chí` : "—"}
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate font-mono text-xs"
                        title={file?.originalFileName}
                      >
                        {file?.originalFileName ?? "—"}
                      </TableCell>
                      <TableCell>{entries.length}</TableCell>
                      <TableCell className="text-right">
                        <Link to={`/batches/${b.id}/grade`} state={{ from: "/assigned-submissions" }}>
                          <Button size="sm" type="button">
                            Mở bảng chấm
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
