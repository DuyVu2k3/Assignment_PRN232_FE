import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { HttpRequestError } from "../../../api/http/requestJson";
import {
  examsService,
  submissionBatchesService,
  type Exam,
  type SubmissionBatchListItem,
} from "../../../api/services";
import { SubmissionBatchPipelineStatus } from "../../../types/enums";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { RefreshCw, Table2 } from "lucide-react";
import { toast } from "sonner";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("vi-VN");
};

/** API đôi khi trả status dạng string — chuẩn hóa về số để UI không lệch. */
const normalizePipelineStatus = (raw: unknown): number => {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 0 && n <= 3) {
    return n;
  }
  return -1;
};

const statusLabel = (status: number) => {
  switch (status) {
    case SubmissionBatchPipelineStatus.PendingExtraction:
      return "Chờ giải nén";
    case SubmissionBatchPipelineStatus.Processing:
      return "Đang xử lý";
    case SubmissionBatchPipelineStatus.Completed:
      return "Hoàn tất";
    case SubmissionBatchPipelineStatus.Failed:
      return "Lỗi";
    default:
      return `Không rõ (${status})`;
  }
};

function BatchPipelineBar({ status: rawStatus }: { status: unknown }) {
  const status = normalizePipelineStatus(rawStatus);

  if (status === SubmissionBatchPipelineStatus.Failed) {
    return (
      <div className="space-y-1 min-w-[220px]">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 flex-1 rounded-full bg-red-200"
              title="Pipeline thất bại"
            />
          ))}
        </div>
        <Badge variant="destructive">{statusLabel(status)}</Badge>
      </div>
    );
  }

  const activeIndex =
    status >= SubmissionBatchPipelineStatus.PendingExtraction &&
    status <= SubmissionBatchPipelineStatus.Completed
      ? status
      : -1;

  const steps = [
    { idx: 0, short: "Chờ giải nén" },
    { idx: 1, short: "Đang xử lý" },
    { idx: 2, short: "Hoàn tất" },
  ];

  const badgeVariant =
    activeIndex === SubmissionBatchPipelineStatus.Completed
      ? "success"
      : activeIndex === SubmissionBatchPipelineStatus.Processing
        ? "default"
        : activeIndex === SubmissionBatchPipelineStatus.PendingExtraction
          ? "warning"
          : "secondary";

  return (
    <div className="space-y-2 w-full max-w-[280px]">
      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={activeIndex < 0 ? 0 : activeIndex + 1}
        aria-valuemin={0}
        aria-valuemax={3}
      >
        {steps.map((s) => (
          <div
            key={s.idx}
            className={cn(
              "h-2.5 min-w-[52px] flex-1 rounded-full transition-colors",
              activeIndex >= s.idx ? "bg-blue-600" : "bg-gray-200"
            )}
            title={s.short}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 text-[10px] leading-tight text-gray-500 text-center">
        {steps.map((s) => (
          <span
            key={s.idx}
            className={cn(
              "px-0.5 break-words",
              activeIndex === s.idx && "font-semibold text-gray-900"
            )}
          >
            {s.short}
          </span>
        ))}
      </div>
      <Badge variant={badgeVariant}>{statusLabel(status)}</Badge>
    </div>
  );
}

function AssignmentCell({ batch }: { batch: SubmissionBatchListItem }) {
  const status = normalizePipelineStatus(batch.status);
  const assignedExaminers = batch.assignedExaminers ?? [];

  if (status !== SubmissionBatchPipelineStatus.Completed) {
    return (
      <span className="text-sm text-gray-500">
        {status === SubmissionBatchPipelineStatus.Failed
          ? "—"
          : "Chờ batch hoàn tất"}
      </span>
    );
  }

  if (assignedExaminers.length === 0) {
    return (
      <span className="inline-flex">
        <Badge variant="warning" className="whitespace-normal text-left max-w-[200px]">
          Chưa gán examiner
        </Badge>
      </span>
    );
  }

  return (
    <div className="text-sm space-y-1 max-w-[min(100%,280px)]">
      <Badge variant="success" className="mb-1">
        Đã gán {assignedExaminers.length} người
      </Badge>
      <ul className="text-xs text-gray-700 space-y-1 pl-0 list-none">
        {assignedExaminers.map((a) => (
          <li key={a.assignmentId} className="border-l-2 border-green-200 pl-2">
            <span className="font-medium">{a.examinerName}</span>
            <span className="text-gray-500"> · #{a.examinerId}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BatchesStatusPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [batches, setBatches] = useState<SubmissionBatchListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const examById = useMemo(() => {
    const map = new Map<number, Exam>();
    for (const e of exams) {
      map.set(e.id, e);
    }
    return map;
  }, [exams]);

  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => {
      const ta = new Date(a.uploadedAt).getTime();
      const tb = new Date(b.uploadedAt).getTime();
      return tb - ta;
    });
  }, [batches]);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [examList, batchList] = await Promise.all([
        examsService.getExams(),
        submissionBatchesService.getSubmissionBatches(),
      ]);
      setExams(Array.isArray(examList) ? examList : []);
      setBatches(Array.isArray(batchList) ? batchList : []);
    } catch (error) {
      const message =
        error instanceof HttpRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Không tải được danh sách batch";
      toast.error(message);
      setBatches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Trạng thái batch</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Theo dõi pipeline xử lý batch và examiner đã được gán khi batch hoàn tất.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => void loadAll()} disabled={isLoading}>
          <RefreshCw className={cn("size-4 mr-2", isLoading && "animate-spin")} />
          {isLoading ? "Đang tải..." : "Tải lại"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Table2 className="size-5" />
            Submission batches
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Batch</TableHead>
                <TableHead className="min-w-[140px]">Kỳ thi</TableHead>
                <TableHead className="whitespace-nowrap">File ID</TableHead>
                <TableHead className="min-w-[260px] w-[280px]">Tiến trình</TableHead>
                <TableHead className="min-w-[160px]">Phân công chấm</TableHead>
                <TableHead className="min-w-[120px] max-w-[220px]">Ghi chú / lỗi</TableHead>
                <TableHead className="whitespace-nowrap">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBatches.map((b) => {
                const exam = examById.get(b.examId);
                const pipelineStatus = normalizePipelineStatus(b.status);
                const canOpenGrading = pipelineStatus === SubmissionBatchPipelineStatus.Completed;
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono align-top whitespace-nowrap">{b.id}</TableCell>
                    <TableCell className="align-top min-w-0 max-w-[220px]">
                      {exam ? (
                        <span className="block">
                          <span className="font-medium line-clamp-2">{exam.title}</span>
                          <span className="block text-xs text-gray-500">Exam ID: {b.examId}</span>
                        </span>
                      ) : (
                        <span className="text-sm">Exam ID: {b.examId}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs align-top whitespace-nowrap">{b.submissionFileId}</TableCell>
                    <TableCell className="align-top">
                      <BatchPipelineBar status={b.status} />
                      <p className="text-[11px] text-gray-500 mt-2 max-w-[280px]">
                        Tải lên: {formatDateTime(b.uploadedAt)}
                        {b.processedAt ? (
                          <>
                            <br />
                            Xử lý xong: {formatDateTime(b.processedAt)}
                          </>
                        ) : null}
                      </p>
                    </TableCell>
                    <TableCell className="align-top">
                      <AssignmentCell batch={b} />
                    </TableCell>
                    <TableCell className="align-top text-sm max-w-[220px]">
                      {pipelineStatus === SubmissionBatchPipelineStatus.Failed && b.errorMessage ? (
                        <span className="text-red-600 break-words">{b.errorMessage}</span>
                      ) : b.notes ? (
                        <span className="text-gray-700 break-words">{b.notes}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap">
                      {canOpenGrading ? (
                        <Link to={`/batches/${b.id}/grade`} state={{ from: "/batches" }}>
                          <Button variant="outline" size="sm" type="button">
                            Bảng chấm rubric
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" size="sm" type="button" disabled title="Chỉ mở khi batch đã hoàn tất">
                          Bảng chấm rubric
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {!isLoading && sortedBatches.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Chưa có batch nào</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
