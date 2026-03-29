import { useParams, Link } from "react-router";
import { formatExamPeriod, mockExams, mockRubrics, mockSemesters, mockSubmissions } from "../../data/mockData";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ArrowLeft, Calendar, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function ExamDetailPage() {
  const { id } = useParams();
  const exam = mockExams.find((e) => e.id === id);
  const submissions = mockSubmissions.filter((s) => s.examId === id);
  const semester = exam ? mockSemesters.find((s) => s.id === exam.semesterId) : undefined;
  const rubricCount = exam ? mockRubrics.filter((r) => r.examId === exam.id).length : 0;

  if (!exam) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy kỳ thi</p>
        <Link to="/exams">
          <Button variant="outline" className="mt-4">
            Quay lại
          </Button>
        </Link>
      </div>
    );
  }

  const examStatusVariant = (s: string) => {
    switch (s) {
      case "Active":
        return "success" as const;
      case "Draft":
        return "warning" as const;
      case "Archived":
        return "secondary" as const;
      default:
        return "default" as const;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="warning">Chờ chấm</Badge>;
      case "Grading":
        return <Badge variant="default">Đang chấm</Badge>;
      case "Graded":
        return <Badge variant="success">Đã chấm</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
          <h1>{exam.title}</h1>
          <p className="text-gray-600 mt-1">Chi tiết kỳ thi & bài nộp (theo entry)</p>
        </div>
        <Button variant="outline">Chỉnh sửa</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin kỳ thi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Đợt kỳ thi</p>
                <p className="font-medium">{formatExamPeriod(exam)}</p>
                <p className="text-xs text-gray-500 mt-1">{semester?.name ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Mã môn</p>
                <p className="font-medium">{exam.courseCode ?? exam.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Rubric (tiêu chí)</p>
                <p className="font-medium">{rubricCount} tiêu chí</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Môn (hiển thị)</p>
                <p className="font-medium">{exam.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Tổng điểm</p>
                <p className="font-medium">{exam.totalPoints} điểm</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Thời gian làm bài</p>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-gray-400" />
                  <p className="font-medium">{exam.duration} phút</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                <Badge variant={examStatusVariant(exam.status)}>{exam.status}</Badge>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Mô tả</p>
              <p className="text-gray-700">{exam.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500 mb-1">Người tạo</p>
                <div className="flex items-center gap-2">
                  <User className="size-4 text-gray-400" />
                  <p className="font-medium">{exam.createdBy}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Ngày tạo</p>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-gray-400" />
                  <p className="font-medium">
                    {format(new Date(exam.createdAt), "dd/MM/yyyy", { locale: vi })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thống kê</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <FileText className="size-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-semibold">{submissions.length}</p>
              <p className="text-sm text-gray-600">Tổng bài nộp</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Đã chấm</span>
                <span className="font-medium">
                  {submissions.filter((s) => s.status === "Graded").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Đang chấm</span>
                <span className="font-medium">
                  {submissions.filter((s) => s.status === "Grading").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Chờ chấm</span>
                <span className="font-medium">
                  {submissions.filter((s) => s.status === "Pending").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bài nộp</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã học sinh</TableHead>
                <TableHead>Tên học sinh</TableHead>
                <TableHead>Thời gian nộp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.studentId}</TableCell>
                  <TableCell>{submission.studentName}</TableCell>
                  <TableCell>
                    {format(new Date(submission.submittedAt), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>
                    {submission.score !== undefined ? (
                      <span className="font-medium">{submission.score}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {submission.status !== "Graded" && (
                      <Link to={`/submissions/${submission.id}/grade`}>
                        <Button variant="outline" size="sm">
                          Chấm điểm
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
