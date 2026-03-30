import React, { useCallback, useEffect, useMemo, useState } from "react";
import { HttpRequestError } from "../../../api/http/requestJson";
import {
  examsService,
  gradeEntriesService,
  semestersService,
  submissionBatchesService,
  usersService,
  type Exam,
  type GradeEntryRow,
  type PagedGradeEntriesResponse,
  type Semester,
  type SubmissionBatchListItem,
  type UserListItem,
} from "../../../api/services";
import { UserRole } from "../../../types/enums";
import { useAuthStore } from "../../../store/authStore";
import { cn } from "../../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
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
import { ChevronLeft, ChevronRight, FileBarChart, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const ALL = "all";

const formatDateTime = (value: string) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleString("vi-VN");
};

export function ScoreReportsPage() {
  const token = useAuthStore((s) => s.token);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [batches, setBatches] = useState<SubmissionBatchListItem[]>([]);
  const [examiners, setExaminers] = useState<UserListItem[]>([]);

  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [isLoadingRows, setIsLoadingRows] = useState(false);

  const [semesterId, setSemesterId] = useState(ALL);
  const [examId, setExamId] = useState(ALL);
  const [batchId, setBatchId] = useState(ALL);
  const [examinerId, setExaminerId] = useState(ALL);

  const [appliedSemesterId, setAppliedSemesterId] = useState(ALL);
  const [appliedExamId, setAppliedExamId] = useState(ALL);
  const [appliedBatchId, setAppliedBatchId] = useState(ALL);
  const [appliedExaminerId, setAppliedExaminerId] = useState(ALL);

  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [paged, setPaged] = useState<PagedGradeEntriesResponse | null>(null);

  const examinerNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const u of examiners) {
      m.set(u.id, u.name);
    }
    return m;
  }, [examiners]);

  const examsFiltered = useMemo(() => {
    if (appliedSemesterId === ALL) {
      return exams;
    }
    const sid = Number(appliedSemesterId);
    return exams.filter((e) => e.semesterId === sid);
  }, [exams, appliedSemesterId]);

  const batchesFiltered = useMemo(() => {
    let list = batches;
    if (appliedExamId !== ALL) {
      const eid = Number(appliedExamId);
      list = list.filter((b) => b.examId === eid);
    } else if (appliedSemesterId !== ALL) {
      const sid = Number(appliedSemesterId);
      const examIds = new Set(exams.filter((e) => e.semesterId === sid).map((e) => e.id));
      list = list.filter((b) => examIds.has(b.examId));
    }
    return list;
  }, [batches, appliedExamId, appliedSemesterId, exams]);

  const loadMeta = useCallback(async () => {
    setIsLoadingMeta(true);
    try {
      const [semRes, exRes, batchRes, usersRes] = await Promise.all([
        semestersService.getSemesters(),
        examsService.getExams(),
        submissionBatchesService.getSubmissionBatches(),
        usersService.getUsers({ pageNumber: 1, pageSize: 100, token: token ?? undefined }),
      ]);
      setSemesters(Array.isArray(semRes) ? semRes : []);
      setExams(Array.isArray(exRes) ? exRes : []);
      setBatches(Array.isArray(batchRes) ? batchRes : []);
      setExaminers((usersRes.data ?? []).filter((u) => u.role === UserRole.Examiner));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được dữ liệu lọc");
    } finally {
      setIsLoadingMeta(false);
    }
  }, [token]);

  const loadRows = useCallback(async () => {
    setIsLoadingRows(true);
    try {
      const params: Parameters<typeof gradeEntriesService.getGradeEntries>[0] = {
        pageNumber,
        pageSize,
      };
      if (appliedExaminerId !== ALL) {
        const eid = Number(appliedExaminerId);
        if (Number.isInteger(eid) && eid > 0) {
          params.examinerId = eid;
        }
      }
      if (appliedExamId !== ALL) {
        const id = Number(appliedExamId);
        if (Number.isInteger(id) && id > 0) {
          params.examId = id;
        }
      }
      if (appliedSemesterId !== ALL) {
        const id = Number(appliedSemesterId);
        if (Number.isInteger(id) && id > 0) {
          params.semesterId = id;
        }
      }
      if (appliedBatchId !== ALL) {
        const id = Number(appliedBatchId);
        if (Number.isInteger(id) && id > 0) {
          params.submissionBatchId = id;
        }
      }

      const res = await gradeEntriesService.getGradeEntries(params);
      setPaged(res);
    } catch (error) {
      setPaged(null);
      const message =
        error instanceof HttpRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Không tải được bảng điểm";
      toast.error(message);
    } finally {
      setIsLoadingRows(false);
    }
  }, [
    pageNumber,
    pageSize,
    appliedExaminerId,
    appliedExamId,
    appliedSemesterId,
    appliedBatchId,
  ]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    setExamId(ALL);
    setBatchId(ALL);
  }, [semesterId]);

  useEffect(() => {
    setBatchId(ALL);
  }, [examId]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const applyFilters = () => {
    setAppliedSemesterId(semesterId);
    setAppliedExamId(examId);
    setAppliedBatchId(batchId);
    setAppliedExaminerId(examinerId);
    setPageNumber(1);
  };

  const rows: GradeEntryRow[] = paged?.data ?? [];
  const totalPages = paged?.totalPages ?? 0;
  const totalItems = paged?.totalItems ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <FileBarChart className="size-7 text-gray-500" />
          Báo cáo điểm (grade entries)
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Dữ liệu từ <span className="font-mono">GET /grade-entries</span> — lọc theo học kỳ, đề, batch và examiner (nếu
          backend hỗ trợ thêm query).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Học kỳ</Label>
              <Select value={semesterId} onValueChange={setSemesterId} disabled={isLoadingMeta}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả học kỳ</SelectItem>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Kỳ thi (đề)</Label>
              <Select
                value={examId}
                onValueChange={(v) => {
                  setExamId(v);
                  setBatchId(ALL);
                }}
                disabled={isLoadingMeta}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đề" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả đề</SelectItem>
                  {(semesterId === ALL ? exams : exams.filter((e) => e.semesterId === Number(semesterId))).map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={batchId} onValueChange={setBatchId} disabled={isLoadingMeta}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả batch</SelectItem>
                  {(examId === ALL
                    ? semesterId === ALL
                      ? batches
                      : batches.filter((b) =>
                          exams.some((e) => e.id === b.examId && e.semesterId === Number(semesterId))
                        )
                    : batches.filter((b) => b.examId === Number(examId))
                  ).map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      Batch #{b.id}
                      <span className="text-gray-500"> · exam {b.examId}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Examiner</Label>
              <Select value={examinerId} onValueChange={setExaminerId} disabled={isLoadingMeta}>
                <SelectTrigger>
                  <SelectValue placeholder="Examiner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả examiner</SelectItem>
                  {examiners.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Số dòng / trang</Label>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={applyFilters} disabled={isLoadingMeta}>
              Áp dụng bộ lọc
            </Button>
            <Button type="button" variant="outline" onClick={() => void loadRows()} disabled={isLoadingRows}>
              <RefreshCw className={cn("size-4 mr-2", isLoadingRows && "animate-spin")} />
              Tải lại
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Kết quả</CardTitle>
          <p className="text-sm text-gray-500">
            {totalItems > 0 ? (
              <>
                Trang {pageNumber}/{Math.max(1, totalPages)} — {totalItems} bản ghi
              </>
            ) : (
              "Không có dữ liệu"
            )}
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Grade ID</TableHead>
                <TableHead>Entry ID</TableHead>
                <TableHead>Examiner</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead>Thời điểm chấm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingRows ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    Không có bản ghi phù hợp
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-gray-500">{(pageNumber - 1) * pageSize + index + 1}</TableCell>
                    <TableCell className="font-mono text-sm">{row.id}</TableCell>
                    <TableCell className="font-mono text-sm">{row.submissionEntryId}</TableCell>
                    <TableCell>
                      <span className="font-medium">{examinerNameById.get(row.examinerId) ?? `User #${row.examinerId}`}</span>
                      <span className="block text-xs text-gray-500">ID: {row.examinerId}</span>
                    </TableCell>
                    <TableCell className="font-semibold">{row.score}</TableCell>
                    <TableCell className="max-w-[280px] text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {row.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDateTime(row.gradedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {paged && totalPages > 1 ? (
            <div className="flex items-center justify-between gap-2 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!paged.hasPrevious || isLoadingRows}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4 mr-1" />
                Trước
              </Button>
              <span className="text-sm text-gray-600">
                Trang {pageNumber} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!paged.hasNext || isLoadingRows}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                Sau
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
