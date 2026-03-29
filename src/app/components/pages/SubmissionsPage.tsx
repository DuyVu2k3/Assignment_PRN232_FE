import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { mockSubmissionBatches } from "../../data/mockData";
import { mockSubmissions } from "../../data/mockData";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Upload, Search, Download } from "lucide-react";
import { submissionFilesService, examsService } from "../../api/services";
import { format } from "date-fns";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { vi } from "date-fns/locale";

export function SubmissionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // single upload only: archive input
  const [archiveFileName, setArchiveFileName] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [exams, setExams] = useState<{ id: number; title: string }[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  

  useEffect(() => {
    let mounted = true;
    examsService.getExams().then((list) => {
      if (!mounted) return;
      setExams(list.map((e) => ({ id: e.id, title: e.title })));
      if (list.length > 0) setSelectedExamId(list[0].id);
    }).catch(() => {
      // ignore
    });
    return () => { mounted = false; };
  }, []);

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

  const stats = [
    {
      label: "Tổng bài nộp",
      value: mockSubmissions.length,
      color: "text-blue-600",
    },
    {
      label: "Chờ chấm",
      value: mockSubmissions.filter((s) => s.status === "Pending").length,
      color: "text-orange-600",
    },
    {
      label: "Đang chấm",
      value: mockSubmissions.filter((s) => s.status === "Grading").length,
      color: "text-blue-600",
    },
    {
      label: "Đã chấm",
      value: mockSubmissions.filter((s) => s.status === "Graded").length,
      color: "text-green-600",
    },
  ];

  const filteredSubmissions = mockSubmissions.filter((submission) => {
    const matchesSearch =
      submission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.examTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === "all" || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  
  // Page layout

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Quản lý Bài thi</h1>
          <p className="text-gray-600 mt-1">
            PRN232 — chấm từng entry hoặc mở bảng theo batch (cột StudentCode + từng tiêu chí
            rubric, nhập như Excel).
          </p>
          {mockSubmissionBatches[0] ? (
            <p className="text-sm text-muted-foreground mt-2">
              <Link
                to={`/batches/${mockSubmissionBatches[0].id}/grade`}
                state={{ from: "/submissions" }}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Bảng chấm batch mẫu ({mockSubmissionBatches[0].id})
              </Link>
            </p>
          ) : null}
        </div>

        <div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Upload className="size-4 mr-2" />
                Upload bài thi hàng loạt
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tải lên bài thi hàng loạt</DialogTitle>
                <DialogDescription>
                  Vui lòng chọn kỳ thi, ghi chú (tuỳ chọn) và upload file .zip chứa bài nộp.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Chọn kỳ thi</label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={selectedExamId ?? ''}
                    onChange={(e) => setSelectedExamId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">-- Chọn kỳ thi --</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>{ex.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Ghi chú (Notes)</label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded px-2 py-1" />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Archive (.zip)</label>
                  <div className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => {
                      const f = e.currentTarget.files?.[0];
                      setArchiveFileName(f ? f.name : null);
                    }} />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Chọn archive</Button>
                    <span className="text-sm text-muted-foreground">{archiveFileName ?? 'Chưa có tệp nào'}</span>
                  </div>
                </div>

                {/* single upload only - no grading file */}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Huỷ</Button>
                </DialogClose>

                <Button
                  onClick={async () => {
                    const file = fileInputRef.current?.files?.[0];
                    if (!file) {
                      alert('Vui lòng chọn file .zip');
                      return;
                    }
                    if (!selectedExamId) {
                      alert('Vui lòng chọn kỳ thi (Exam)');
                      return;
                    }

                    try {
                      await submissionFilesService.upload(file, selectedExamId, notes);
                      alert('Tải lên thành công');
                    } catch (err: any) {
                      alert(err?.message ?? 'Upload thất bại');
                    }
                  }}
                >
                  Upload
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Tìm theo tên, MSSV, kỳ thi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="Pending">Chờ chấm</SelectItem>
            <SelectItem value="Grading">Đang chấm</SelectItem>
            <SelectItem value="Graded">Đã chấm</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Download className="size-4 mr-2" />
          Xuất báo cáo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bài nộp</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã SV (StudentCode)</TableHead>
                <TableHead>Tên học sinh</TableHead>
                <TableHead>Kỳ thi</TableHead>
                <TableHead>Thời gian nộp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.studentId}
                  </TableCell>
                  <TableCell>{submission.studentName}</TableCell>
                  <TableCell>{submission.examTitle}</TableCell>
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
                    <div className="flex items-center gap-2">
                      {submission.status !== "Graded" && (
                        <Link to={`/submissions/${submission.id}/grade`} state={{ from: "/submissions" }}>
                          <Button variant="outline" size="sm">
                            Chấm điểm
                          </Button>
                        </Link>
                      )}
                      <Button variant="ghost" size="sm">
                        Xem
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredSubmissions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy bài nộp nào</p>
        </div>
      )}
    </div>
  );
}
