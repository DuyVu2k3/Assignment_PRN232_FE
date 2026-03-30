import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { HttpRequestError } from "../../../api/http/requestJson";
import {
  examinerEntriesService,
  type GradeEntryRow,
  type PagedGradeEntriesResponse,
} from "../../../api/services";
import { useAuthStore } from "../../../store/authStore";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { ChevronLeft, ChevronRight, History, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const formatDateTime = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleString("vi-VN");
};

export function GradingHistoryPage() {
  const user = useAuthStore((s) => s.user);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [paged, setPaged] = useState<PagedGradeEntriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);

  /** submissionEntryId → hiển thị từ danh sách được phân (có thể thiếu với bản ghi cũ). */
  const [entryMeta, setEntryMeta] = useState<Map<number, { studentCode: string; examTitle: string }>>(
    () => new Map()
  );

  const loadEntryMeta = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const groups = await examinerEntriesService.getMyEntries();
      const m = new Map<number, { studentCode: string; examTitle: string }>();
      for (const g of groups) {
        const examTitle = g.batch.examTitle;
        for (const e of g.entries) {
          m.set(e.id, { studentCode: e.studentCode, examTitle });
        }
      }
      setEntryMeta(m);
    } catch {
      setEntryMeta(new Map());
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  const loadRows = useCallback(async () => {
    if (!user) {
      setPaged(null);
      return;
    }

    setLoading(true);
    try {
      const res = await examinerEntriesService.getMyGradeHistory({
        pageNumber,
        pageSize,
      });
      setPaged(res);
    } catch (err) {
      setPaged(null);
      const msg =
        err instanceof HttpRequestError ? err.message : "Không tải được lịch sử chấm điểm.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [user, pageNumber, pageSize]);

  useEffect(() => {
    void loadEntryMeta();
  }, [loadEntryMeta]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const rows: GradeEntryRow[] = paged?.data ?? [];
  const totalPages = Math.max(1, paged?.totalPages ?? 1);
  const totalItems = paged?.totalItems ?? 0;
  const hasPrevious = paged?.hasPrevious ?? false;
  const hasNext = paged?.hasNext ?? false;

  const emptyMessage = useMemo(() => {
    if (!user) return "Chưa đăng nhập.";
    return null;
  }, [user]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <History className="size-7 text-muted-foreground" />
          Lịch sử chấm
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Các bản ghi chấm điểm của bạn (examiner từ token) —{" "}
          <code className="text-xs bg-muted px-1 rounded">GET /api/examiners/me/grade-entries</code>
        </p>
      </div>

      {emptyMessage ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-base">Bộ lọc</CardTitle>
                <CardDescription>
                  Chỉ hiển thị điểm của examiner đang đăng nhập. Mã SV / kỳ thi lấy thêm từ{" "}
                  <code className="text-xs">GET /api/examiners/me/entries</code> khi trùng entry.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || loadingMeta}
                  onClick={() => {
                    void loadEntryMeta();
                    void loadRows();
                  }}
                >
                  {loading || loadingMeta ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  Làm mới
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Số dòng / trang</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setPageNumber(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading && !paged ? (
                <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
                  <Loader2 className="size-5 animate-spin" />
                  Đang tải…
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã SV</TableHead>
                      <TableHead>Kỳ thi</TableHead>
                      <TableHead className="font-mono text-xs">Entry</TableHead>
                      <TableHead className="text-right">Điểm</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead>Thời điểm chấm</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                          Chưa có bản ghi chấm điểm nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => {
                        const meta = entryMeta.get(row.submissionEntryId);
                        return (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">
                              {meta?.studentCode ?? (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>{meta?.examTitle ?? <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="font-mono text-xs">#{row.submissionEntryId}</TableCell>
                            <TableCell className="text-right tabular-nums font-medium">{row.score}</TableCell>
                            <TableCell className="max-w-[220px] truncate" title={row.notes ?? ""}>
                              {row.notes ?? "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDateTime(row.gradedAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" asChild>
                                <Link
                                  to={`/assigned-submissions/entries/${row.submissionEntryId}/grade`}
                                  state={{ from: "/grading-history" }}
                                >
                                  Mở entry
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}

              {totalItems > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Trang {paged?.pageNumber ?? pageNumber} / {totalPages} — {totalItems} bản ghi
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!hasPrevious || loading}
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                      Trước
                    </Button>
                    <Badge variant="secondary">{pageNumber}</Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!hasNext || loading}
                      onClick={() => setPageNumber((p) => p + 1)}
                    >
                      Sau
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
