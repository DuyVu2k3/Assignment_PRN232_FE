import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { HttpRequestError } from "../../../api/http/requestJson";
import { examinerEntriesService, type ExaminerMeBatchGroup } from "../../../api/services";
import { useAuthStore } from "../../../store/authStore";
import { SubmissionBatchPipelineStatus } from "../../../types/enums";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { ClipboardList, Loader2, Table2 } from "lucide-react";
import { toast } from "sonner";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString("vi-VN");
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

/** Map entry.status (số) — bổ sung khi backend có thêm mã. */
const entryStatusBadge = (status: number) => {
  switch (status) {
    case 0:
      return { label: "Chờ", variant: "secondary" as const };
    case 1:
      return { label: "Sẵn sàng", variant: "success" as const };
    case 2:
      return { label: "Lỗi", variant: "destructive" as const };
    default:
      return { label: `Trạng thái ${status}`, variant: "outline" as const };
  }
};

export function AssignedSubmissionsPage() {
  const user = useAuthStore((s) => s.user);

  const [groups, setGroups] = useState<ExaminerMeBatchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await examinerEntriesService.getMyEntries();
      setGroups(data);
      setSelectedBatchId((prev) => {
        if (prev !== null && data.some((g) => g.batchId === prev)) {
          return prev;
        }
        return data[0]?.batchId ?? null;
      });
    } catch (err) {
      const msg = err instanceof HttpRequestError ? err.message : "Không tải được danh sách được phân.";
      toast.error(msg);
      setGroups([]);
      setSelectedBatchId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.batchId === selectedBatchId) ?? null,
    [groups, selectedBatchId]
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Table2 className="size-7 text-muted-foreground" />
          Bài được phân công
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Bước 1: chọn batch ở cột trái. Bước 2: chọn entry — <strong>Mở chấm</strong> để nhập điểm theo rubric (
          Tab giữa các ô) và lưu qua API <code className="text-xs bg-muted px-1 rounded">POST /grade-entries</code>.
        </p>
      </div>

      {!user ? (
        <p className="text-sm text-muted-foreground">Đang tải thông tin đăng nhập…</p>
      ) : loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Đang tải danh sách được phân…
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chưa có batch được phân</CardTitle>
            <CardDescription>
              Khi Manager gán bạn cho batch, dữ liệu sẽ hiện từ{" "}
              <code className="text-xs">GET /api/examiners/me/entries</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-80 shrink-0 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Batch</p>
            <ul className="space-y-2">
              {groups.map((g) => {
                const bs = batchStatusBadge(g.batch.status);
                const active = g.batchId === selectedBatchId;
                return (
                  <li key={g.batchId}>
                    <button
                      type="button"
                      onClick={() => setSelectedBatchId(g.batchId)}
                      className={cn(
                        "w-full text-left rounded-lg border px-3 py-2.5 transition-colors",
                        active ? "border-blue-600 bg-blue-50/80 shadow-sm" : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="font-medium text-sm line-clamp-2">{g.batch.examTitle}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Nộp {formatDateTime(g.batch.uploadedAt)}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant={bs.variant}>{bs.label}</Badge>
                        <Badge variant="secondary">{g.entries.length} SV</Badge>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <Card className="flex-1 min-w-0 w-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="size-5" />
                Entry trong batch đã chọn
              </CardTitle>
              <CardDescription>
                {selectedGroup ? (
                  <>
                    <span className="font-medium text-foreground">{selectedGroup.batch.examTitle}</span>
                    {" · "}
                    Hạn thi {formatDateTime(selectedGroup.batch.examDueDate)}
                  </>
                ) : (
                  "Chọn một batch."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {!selectedGroup ? (
                <p className="text-sm text-muted-foreground">Không có batch được chọn.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã SV</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Vi phạm</TableHead>
                      <TableHead className="text-right">Tài nguyên</TableHead>
                      <TableHead>Đã chấm</TableHead>
                      <TableHead className="text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedGroup.entries.map((e) => {
                      const es = entryStatusBadge(e.status);
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.studentCode}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              <Badge variant={es.variant}>{es.label}</Badge>
                              {e.violationCount > 0 ? (
                                <Badge variant="warning">Có vi phạm</Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{e.violationCount}</TableCell>
                          <TableCell className="text-right tabular-nums">{e.assetCount}</TableCell>
                          <TableCell>
                            {e.myGrade ? (
                              <Badge variant="success">
                                {e.myGrade.totalScore} điểm · {formatDateTime(e.myGrade.gradedAt)}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Chưa</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" type="button" asChild>
                              <Link
                                to={`/assigned-submissions/entries/${e.id}/grade`}
                                state={{
                                  examId: selectedGroup.batch.examId,
                                  batchId: selectedGroup.batchId,
                                }}
                              >
                                Mở chấm
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
