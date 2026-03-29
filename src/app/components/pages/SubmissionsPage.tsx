import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router";
import { HttpRequestError } from "../../api/http/requestJson";
import {
  examsService,
  submissionBatchesService,
  submissionFilesService,
  type SubmissionBatchListItem,
} from "../../api/services";
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
import { Upload, Search, Download, Loader2, RefreshCw } from "lucide-react";
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
import { SubmissionBatchPipelineStatus } from "../../types/enums";
import { toast } from "sonner";

const normalizePipelineStatus = (raw: unknown): number => {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 0 && n <= 3) {
    return n;
  }
  return -1;
};

const batchStatusBadge = (status: number) => {
  switch (status) {
    case SubmissionBatchPipelineStatus.Failed:
      return <Badge variant="destructive">Lỗi</Badge>;
    case SubmissionBatchPipelineStatus.Completed:
      return <Badge variant="success">Hoàn tất</Badge>;
    case SubmissionBatchPipelineStatus.Processing:
      return <Badge variant="default">Đang xử lý</Badge>;
    case SubmissionBatchPipelineStatus.PendingExtraction:
      return <Badge variant="warning">Chờ giải nén</Badge>;
    default:
      return <Badge variant="secondary">Không rõ ({status})</Badge>;
  }
};

export function SubmissionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [archiveFileName, setArchiveFileName] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exams, setExams] = useState<{ id: number; title: string }[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [batches, setBatches] = useState<SubmissionBatchListItem[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  const examTitleById = useMemo(() => {
    const m = new Map<number, string>();
    for (const e of exams) {
      m.set(e.id, e.title);
    }
    return m;
  }, [exams]);

  const loadBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const list = await submissionBatchesService.getSubmissionBatches();
      setBatches(list);
    } catch (err) {
      const msg = err instanceof HttpRequestError ? err.message : "Không tải được danh sách batch.";
      toast.error(msg);
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const examList = await examsService.getExams();
        if (!mounted) return;
        setExams(examList.map((e) => ({ id: e.id, title: e.title })));
        if (examList.length > 0) setSelectedExamId(examList[0].id);
      } catch {
        if (mounted) setExams([]);
      }
      await loadBatches();
    })();
    return () => {
      mounted = false;
    };
  }, [loadBatches]);

  const stats = useMemo(() => {
    const s = (st: number) =>
      batches.filter((b) => normalizePipelineStatus(b.status) === st).length;
    return [
      { label: "Tổng batch", value: batches.length, color: "text-blue-600" },
      {
        label: "Chờ giải nén",
        value: s(SubmissionBatchPipelineStatus.PendingExtraction),
        color: "text-orange-600",
      },
      {
        label: "Đang xử lý",
        value: s(SubmissionBatchPipelineStatus.Processing),
        color: "text-blue-600",
      },
      {
        label: "Hoàn tất",
        value: s(SubmissionBatchPipelineStatus.Completed),
        color: "text-green-600",
      },
    ];
  }, [batches]);

  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const examTitle = examTitleById.get(batch.examId) ?? "";
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        String(batch.id).includes(q) ||
        examTitle.toLowerCase().includes(q) ||
        (batch.notes ?? "").toLowerCase().includes(q);

      const st = normalizePipelineStatus(batch.status);
      const matchesStatus =
        statusFilter === "all" || String(st) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [batches, searchQuery, statusFilter, examTitleById]);

  const firstBatch = batches[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1>Quản lý Bài thi</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Danh sách theo <code className="text-xs bg-muted px-1 rounded">GET /submission-batches</code>
            {firstBatch ? (
              <>
                {" "}
                ·{" "}
                <Link
                  to={`/batches/${firstBatch.id}/grade`}
                  state={{ from: "/submissions" }}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Mở chấm batch đầu tiên (#{firstBatch.id})
                </Link>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingBatches}
            onClick={() => void loadBatches()}
          >
            {loadingBatches ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Làm mới
          </Button>

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
                    value={selectedExamId ?? ""}
                    onChange={(e) => setSelectedExamId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">-- Chọn kỳ thi --</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Ghi chú (Notes)</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Archive (.zip)</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip,application/zip"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.currentTarget.files?.[0];
                        setArchiveFileName(f ? f.name : null);
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Chọn archive
                    </Button>
                    <span className="text-sm text-muted-foreground">{archiveFileName ?? "Chưa có tệp nào"}</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Huỷ</Button>
                </DialogClose>

                <Button
                  onClick={async () => {
                    const file = fileInputRef.current?.files?.[0];
                    if (!file) {
                      toast.error("Vui lòng chọn file .zip");
                      return;
                    }
                    if (!selectedExamId) {
                      toast.error("Vui lòng chọn kỳ thi (Exam)");
                      return;
                    }

                    try {
                      await submissionFilesService.upload(file, selectedExamId, notes);
                      toast.success("Tải lên thành công");
                      await loadBatches();
                    } catch (err: unknown) {
                      const msg = err instanceof HttpRequestError ? err.message : "Upload thất bại";
                      toast.error(msg);
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Tìm theo mã batch, kỳ thi, ghi chú…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Trạng thái pipeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value={String(SubmissionBatchPipelineStatus.PendingExtraction)}>
              Chờ giải nén
            </SelectItem>
            <SelectItem value={String(SubmissionBatchPipelineStatus.Processing)}>Đang xử lý</SelectItem>
            <SelectItem value={String(SubmissionBatchPipelineStatus.Completed)}>Hoàn tất</SelectItem>
            <SelectItem value={String(SubmissionBatchPipelineStatus.Failed)}>Lỗi</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" type="button">
          <Download className="size-4 mr-2" />
          Xuất báo cáo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bài nộp (theo batch)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBatches && batches.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
              <Loader2 className="size-5 animate-spin" />
              Đang tải danh sách…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã batch</TableHead>
                  <TableHead>Kỳ thi</TableHead>
                  <TableHead>Thời gian nộp</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Giám khảo đã gán</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => {
                  const st = normalizePipelineStatus(batch.status);
                  const examTitle = examTitleById.get(batch.examId) ?? `Exam #${batch.examId}`;
                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono font-medium">#{batch.id}</TableCell>
                      <TableCell>{examTitle}</TableCell>
                      <TableCell>
                        {format(new Date(batch.uploadedAt), "dd/MM/yyyy HH:mm", {
                          locale: vi,
                        })}
                      </TableCell>
                      <TableCell>{batchStatusBadge(st)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {batch.assignedExaminers?.length
                          ? batch.assignedExaminers.map((a) => a.examinerName).join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={batch.notes ?? ""}>
                        {batch.notes ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/batches/${batch.id}/grade`} state={{ from: "/submissions" }}>
                            <Button variant="outline" size="sm">
                              Chấm điểm
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" type="button">
                            Xem
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loadingBatches && filteredBatches.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không có batch nào khớp bộ lọc</p>
        </div>
      )}
    </div>
  );
}
