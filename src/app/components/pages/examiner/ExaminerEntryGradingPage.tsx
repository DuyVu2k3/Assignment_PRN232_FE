import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { HttpRequestError } from "../../../api/http/requestJson";
import {
  examinerEntriesService,
  gradeEntriesService,
  rubricsService,
  submissionSolutionsService,
  type ExaminerEntryDto,
  type ExaminerMeBatchGroup,
  type Rubric,
  type SubmissionSolutionFilesResponse,
} from "../../../api/services";
import { SolutionFilesExplorer } from "../../examiner/SolutionFilesExplorer";
import { buildSolutionZipBlob } from "../../../lib/solutionZipDownload";
import { useAuthStore } from "../../../store/authStore";
import { SubmissionBatchPipelineStatus } from "../../../types/enums";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Textarea } from "../../ui/textarea";
import { ArrowLeft, FileStack, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString("vi-VN");
};

const parseScoreInput = (s: string): number => {
  const t = s.trim().replace(",", ".");
  if (t === "") return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : Number.NaN;
};

const batchStatusBadge = (status: number) => {
  switch (status) {
    case SubmissionBatchPipelineStatus.Failed:
      return { label: "Lỗi", variant: "destructive" as const };
    case SubmissionBatchPipelineStatus.Completed:
      return { label: "Hoàn tất", variant: "success" as const };
    case SubmissionBatchPipelineStatus.Processing:
      return { label: "Đang xử lý", variant: "default" as const };
    case SubmissionBatchPipelineStatus.PendingExtraction:
      return { label: "Chờ giải nén", variant: "warning" as const };
    default:
      return { label: `Batch ${status}`, variant: "secondary" as const };
  }
};

export function ExaminerEntryGradingPage() {
  const { entryId: entryIdParam } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const entryId = entryIdParam ? Number(entryIdParam) : Number.NaN;

  const [loadingCtx, setLoadingCtx] = useState(true);
  const [group, setGroup] = useState<ExaminerMeBatchGroup | null>(null);
  const [entry, setEntry] = useState<ExaminerEntryDto | null>(null);

  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [solutionBundle, setSolutionBundle] = useState<SubmissionSolutionFilesResponse | null>(null);
  const [historyPage] = useState({ pageNumber: 1, pageSize: 10 });
  const [history, setHistory] = useState<Awaited<
    ReturnType<typeof gradeEntriesService.getGradeEntriesBySubmissionEntry>
  > | null>(null);

  const [scoresByRubricId, setScoresByRubricId] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const examinerId = user ? Number(user.id) : Number.NaN;

  const sortedRubrics = useMemo(
    () => [...rubrics].sort((a, b) => a.orderIndex - b.orderIndex),
    [rubrics]
  );

  const totalScore = useMemo(() => {
    let sum = 0;
    for (const r of sortedRubrics) {
      const raw = scoresByRubricId[r.id] ?? "";
      const v = parseScoreInput(raw);
      if (Number.isNaN(v)) return Number.NaN;
      sum += v;
    }
    return sum;
  }, [sortedRubrics, scoresByRubricId]);

  useEffect(() => {
    if (!Number.isFinite(entryId)) {
      setLoadingCtx(false);
      setGroup(null);
      setEntry(null);
      return;
    }

    let cancelled = false;
    setLoadingCtx(true);

    void (async () => {
      try {
        const groups = await examinerEntriesService.getMyEntries();
        if (cancelled) return;
        for (const g of groups) {
          const e = g.entries.find((x) => x.id === entryId);
          if (e) {
            setGroup(g);
            setEntry(e);
            setLoadingCtx(false);
            return;
          }
        }
        setGroup(null);
        setEntry(null);
      } catch (err) {
        const msg = err instanceof HttpRequestError ? err.message : "Không tải được danh sách được phân.";
        toast.error(msg);
        setGroup(null);
        setEntry(null);
      } finally {
        if (!cancelled) setLoadingCtx(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entryId]);

  const examId = group?.batch.examId;

  useEffect(() => {
    if (!entry || !Number.isFinite(examId)) {
      setRubrics([]);
      setSolutionBundle(null);
      setHistory(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);

    void (async () => {
      try {
        const [rList, solutionRes, h] = await Promise.all([
          rubricsService.getRubricsByExamId(examId!),
          submissionSolutionsService.getSolutionFiles(entry.id),
          gradeEntriesService.getGradeEntriesBySubmissionEntry(
            entry.id,
            historyPage.pageNumber,
            historyPage.pageSize
          ),
        ]);
        if (cancelled) return;
        setRubrics(Array.isArray(rList) ? rList : []);
        setSolutionBundle(solutionRes);
        setHistory(h);
      } catch (err) {
        const msg = err instanceof HttpRequestError ? err.message : "Không tải chi tiết bài / rubric.";
        toast.error(msg);
        setRubrics([]);
        setSolutionBundle(null);
        setHistory(null);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entry, examId, historyPage.pageNumber, historyPage.pageSize]);

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDownloadSolutionFile = useCallback(
    async (filePath: string) => {
      if (!entry) return;
      try {
        const blob = await submissionSolutionsService.downloadFile(entry.id, filePath);
        const name = filePath.split(/[/\\]/).pop() || "download.bin";
        triggerBlobDownload(blob, name);
        toast.success("Đã tải file.");
      } catch (err) {
        const msg = err instanceof HttpRequestError ? err.message : "Tải file thất bại.";
        toast.error(msg);
      }
    },
    [entry]
  );

  const onDownloadAttachment = useCallback(
    async (assetId: number, fileName: string) => {
      if (!entry) return;
      try {
        const blob = await submissionSolutionsService.downloadAttachment(entry.id, assetId);
        triggerBlobDownload(blob, fileName || `attachment-${assetId}`);
        toast.success("Đã tải file đính kèm.");
      } catch (err) {
        const msg = err instanceof HttpRequestError ? err.message : "Tải đính kèm thất bại.";
        toast.error(msg);
      }
    },
    [entry]
  );

  const onDownloadAllSolutionFiles = useCallback(async () => {
    if (!entry || !solutionBundle) return;
    const paths = solutionBundle.solutionFiles.filter((f) => !f.isDirectory).map((f) => f.path);
    if (paths.length === 0) {
      toast.info("Không có file để tải.");
      return;
    }

    const rootFolder = `solution_${entry.studentCode}_${entry.id}`;
    const zipName = `${entry.studentCode}_entry${entry.id}_solution.zip`;

    await toast.promise(
      (async () => {
        const blob = await buildSolutionZipBlob({
          paths,
          rootFolderName: rootFolder,
          fetchFile: (p) => submissionSolutionsService.downloadFile(entry.id, p),
        });
        triggerBlobDownload(blob, zipName);
      })(),
      {
        loading: `Đang tải ${paths.length} file và nén thành một file ZIP…`,
        success: "Đã tải về một file ZIP (một thư mục gốc, giữ cấu trúc thư mục trong zip).",
        error: (e) =>
          e instanceof HttpRequestError ? e.message : e instanceof Error ? e.message : "Không tạo được ZIP.",
      }
    );
  }, [entry, solutionBundle]);

  const onSave = useCallback(async () => {
    if (!entry || !Number.isFinite(examinerId)) {
      toast.error("Thiếu thông tin người chấm hoặc bài nộp.");
      return;
    }

    for (const r of sortedRubrics) {
      const raw = scoresByRubricId[r.id] ?? "";
      const v = parseScoreInput(raw);
      if (Number.isNaN(v)) {
        toast.error(`Điểm không hợp lệ tại tiêu chí: ${r.criteria}`);
        return;
      }
      if (v < 0 || v > r.maxScore) {
        toast.error(`Điểm phải từ 0 đến ${r.maxScore} (${r.criteria}).`);
        return;
      }
    }

    if (Number.isNaN(totalScore)) {
      toast.error("Không tính được tổng điểm.");
      return;
    }

    setSaving(true);
    try {
      await gradeEntriesService.createGradeEntry({
        submissionEntryId: entry.id,
        examinerId,
        score: totalScore,
        notes: notes.trim() || null,
      });
      toast.success("Đã lưu điểm.");
      const h = await gradeEntriesService.getGradeEntriesBySubmissionEntry(
        entry.id,
        historyPage.pageNumber,
        historyPage.pageSize
      );
      setHistory(h);
      const groups = await examinerEntriesService.getMyEntries();
      for (const g of groups) {
        const e = g.entries.find((x) => x.id === entry.id);
        if (e) {
          setGroup(g);
          setEntry(e);
          break;
        }
      }
    } catch (err) {
      const msg = err instanceof HttpRequestError ? err.message : "Lưu điểm thất bại.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [
    entry,
    examinerId,
    sortedRubrics,
    scoresByRubricId,
    totalScore,
    notes,
    historyPage.pageNumber,
    historyPage.pageSize,
  ]);

  if (!Number.isFinite(entryId)) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Mã bài không hợp lệ.</p>
        <Button type="button" variant="outline" onClick={() => navigate("/assigned-submissions")}>
          Quay lại
        </Button>
      </div>
    );
  }

  if (loadingCtx) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Đang tải…
      </div>
    );
  }

  if (!group || !entry) {
    return (
      <div className="space-y-4 max-w-lg">
        <p className="text-sm text-muted-foreground">Không tìm thấy bài trong danh sách được phân.</p>
        <Button type="button" variant="outline" asChild>
          <Link to="/assigned-submissions">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const bs = batchStatusBadge(group.batch.status);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button type="button" variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link to="/assigned-submissions" className="gap-1">
              <ArrowLeft className="size-4" />
              Danh sách được phân
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Chấm bài — {entry.studentCode}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {group.batch.examTitle} · Batch #{group.batch.id} · Nộp {formatDateTime(group.batch.uploadedAt)}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={bs.variant}>{bs.label}</Badge>
            {entry.violationCount > 0 ? (
              <Badge variant="warning">Có vi phạm ({entry.violationCount})</Badge>
            ) : null}
            {entry.myGrade ? (
              <Badge variant="success">
                Đã chấm: {entry.myGrade.totalScore} điểm · {formatDateTime(entry.myGrade.gradedAt)}
              </Badge>
            ) : (
              <Badge variant="secondary">Chưa chấm</Badge>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileStack className="size-5" />
            File bài làm
          </CardTitle>
          <CardDescription>
            Cây thư mục từ <code className="text-xs">GET /submission-solutions/…/files</code> — chỉ file (không phải
            folder) mới tải được qua <code className="text-xs">download?filePath=</code> (đúng chuỗi path trong zip).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SolutionFilesExplorer
            loading={loadingDetail}
            solutionFiles={solutionBundle?.solutionFiles ?? []}
            attachments={solutionBundle?.attachments ?? []}
            onDownloadSolutionFile={onDownloadSolutionFile}
            onDownloadAttachment={onDownloadAttachment}
            onDownloadAllFiles={onDownloadAllSolutionFiles}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bảng chấm (rubric)</CardTitle>
          <CardDescription>
            Nhập điểm từng tiêu chí (Tab để chuyển ô). Tổng được gửi lên API dưới dạng một điểm{" "}
            <code className="text-xs bg-muted px-1 rounded">score</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          {loadingDetail ? (
            <p className="text-sm text-muted-foreground">Đang tải rubric…</p>
          ) : sortedRubrics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Kỳ thi chưa có rubric. Vui lòng liên hệ Manager cấu hình{" "}
              <code className="text-xs">GET /api/exams/{examId}/rubrics</code>.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Mã SV</TableHead>
                  {sortedRubrics.map((r) => (
                    <TableHead key={r.id} className="min-w-[140px]">
                      {r.criteria}{" "}
                      <span className="text-muted-foreground font-normal">(tối đa {r.maxScore})</span>
                    </TableHead>
                  ))}
                  <TableHead className="min-w-[100px]">Tổng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{entry.studentCode}</TableCell>
                  {sortedRubrics.map((r, idx) => (
                    <TableCell key={r.id}>
                      <Input
                        className="font-mono tabular-nums"
                        inputMode="decimal"
                        tabIndex={idx + 1}
                        value={scoresByRubricId[r.id] ?? ""}
                        onChange={(e) =>
                          setScoresByRubricId((prev) => ({ ...prev, [r.id]: e.target.value }))
                        }
                        placeholder="0"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="font-semibold tabular-nums">
                    {Number.isNaN(totalScore) ? "—" : totalScore.toFixed(2).replace(/\.?0+$/, "")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}

          <div className="space-y-2 max-w-xl">
            <label className="text-sm font-medium" htmlFor="grade-notes">
              Ghi chú
            </label>
            <Textarea
              id="grade-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhận xét (tuỳ chọn)…"
              rows={3}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="gap-2"
              disabled={saving || loadingDetail || sortedRubrics.length === 0 || !Number.isFinite(examinerId)}
              onClick={() => void onSave()}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Lưu điểm
            </Button>
          </div>
        </CardContent>
      </Card>

      {history && history.data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lịch sử chấm (theo entry)</CardTitle>
            <CardDescription>
              Trang {history.pageNumber}/{Math.max(1, history.totalPages)} — {history.totalItems} bản ghi
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Điểm</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Thời điểm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium tabular-nums">{row.score}</TableCell>
                    <TableCell className="max-w-[280px] truncate" title={row.notes ?? ""}>
                      {row.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(row.gradedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
