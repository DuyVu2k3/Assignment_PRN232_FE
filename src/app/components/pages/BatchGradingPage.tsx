import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router";
import {
  getRubricsForExam,
  getSubmissionBatchById,
  getSubmissionFileById,
  getEntriesForBatch,
  getAssetsForEntry,
  examinerCanAccessBatch,
  mockExams,
  mockGradeRubricScores,
} from "../../data/mockData";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft, Download, Save, Table2 } from "lucide-react";

type ScoreGrid = Record<string, Record<string, string>>;

function initialScoresFromMock(entryIds: string[]): ScoreGrid {
  const grid: ScoreGrid = {};
  for (const eid of entryIds) grid[eid] = {};
  for (const row of mockGradeRubricScores) {
    if (!grid[row.submissionEntryId]) grid[row.submissionEntryId] = {};
    grid[row.submissionEntryId][row.rubricId] = String(row.score);
  }
  return grid;
}

function parseScore(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 0;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function downloadAssetListMock(studentCode: string, entryId: string) {
  const assets = getAssetsForEntry(entryId);
  const lines = [
    `StudentCode\t${studentCode}`,
    "",
    "fileName\trelativePath\tkind",
    ...assets.map((a) => `${a.fileName}\t${a.relativePath}\t${a.kind}`),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${studentCode}_PRN232_assets.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

type GradeLocationState = { from?: string };

export function BatchGradingPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const state = location.state as GradeLocationState | null;
  const backHref = state?.from ?? "/submissions";

  const batch = batchId ? getSubmissionBatchById(batchId) : undefined;
  const examinerBlocked =
    user?.role === "Examiner" &&
    batch != null &&
    batchId != null &&
    user != null &&
    !examinerCanAccessBatch(String(user.id), batchId);
  const exam = batch ? mockExams.find((e) => e.id === batch.examId) : undefined;
  const sourceFile = batch ? getSubmissionFileById(batch.submissionFileId) : undefined;
  const entries = useMemo(
    () => (batchId ? getEntriesForBatch(batchId) : []),
    [batchId],
  );
  const rubrics = exam ? getRubricsForExam(exam.id) : [];

  const [scores, setScores] = useState<ScoreGrid>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!batchId) return;
    const b = getSubmissionBatchById(batchId);
    const ent = b ? getEntriesForBatch(b.id) : [];
    setScores(initialScoresFromMock(ent.map((e) => e.id)));
  }, [batchId]);

  const rowTotal = (entryId: string) => {
    let t = 0;
    for (const r of rubrics) {
      t += parseScore(scores[entryId]?.[r.id]);
    }
    return t;
  };

  const grandHint = exam?.totalPoints ?? rubrics.reduce((s, r) => s + r.maxPoints, 0);

  if (examinerBlocked) {
    return (
      <div className="text-center py-12 space-y-4 max-w-md mx-auto">
        <p className="text-gray-700 font-medium">Bạn không được phân batch này.</p>
        <p className="text-sm text-muted-foreground">
          Quay lại màn hình chọn batch để chỉ mở đúng batch được giao.
        </p>
        <Link to="/assigned-submissions">
          <Button variant="outline">Chọn batch</Button>
        </Link>
      </div>
    );
  }

  if (!batch || !exam || rubrics.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-gray-500">
          {!batch
            ? "Không tìm thấy batch."
            : rubrics.length === 0
              ? "Kỳ thi chưa có rubric — không thể mở bảng chấm."
              : "Thiếu dữ liệu kỳ thi."}
        </p>
        <Link to={backHref}>
          <Button variant="outline">Quay lại</Button>
        </Link>
      </div>
    );
  }

  const setCell = (entryId: string, rubricId: string, value: string) => {
    setScores((prev) => ({
      ...prev,
      [entryId]: { ...prev[entryId], [rubricId]: value },
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const rows = entries.map((ent) => ({
      submissionEntryId: ent.id,
      studentCode: ent.studentCode,
      rubrics: rubrics.map((r) => ({
        rubricId: r.id,
        title: r.title,
        maxPoints: r.maxPoints,
        score: parseScore(scores[ent.id]?.[r.id]),
      })),
      rowTotal: rowTotal(ent.id),
    }));
    console.log("Batch rubric grades (mock POST):", { batchId: batch.id, examId: exam.id, rows });
    setTimeout(() => {
      setSaving(false);
      navigate("/submissions");
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-[100vw] xl:max-w-[calc(100vw-2rem)]">
      <div className="flex flex-wrap items-center gap-4">
        <Link to={backHref}>
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold">
            <Table2 className="size-7 shrink-0 text-muted-foreground" />
            Chấm theo batch — {exam.title}
          </h1>
          <p className="text-gray-600 mt-1 text-sm">
            Batch <span className="font-mono">{batch.id}</span>
            {sourceFile ? (
              <>
                {" "}
                · file gốc: <span className="font-mono text-xs break-all">{sourceFile.originalFileName}</span>
              </>
            ) : null}
            . Tiêu chí do Manager cấu hình; nhập điểm như Excel (Tab / Shift+Tab), xong bấm{" "}
            <strong>Lưu điểm</strong>.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tiêu chí ({rubrics.length}) — tổng tối đa kỳ thi: {grandHint} đ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="overflow-x-auto rounded-md border border-slate-300 bg-white shadow-sm">
              <table className="w-full border-collapse text-sm caption-bottom">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="sticky left-0 z-10 border border-slate-300 bg-slate-100 px-2 py-2 text-left font-medium whitespace-nowrap min-w-[7rem]">
                      StudentCode
                    </th>
                    {rubrics.map((r) => (
                      <th
                        key={r.id}
                        className="border border-slate-300 px-1 py-2 text-center font-medium min-w-[6.5rem] align-bottom"
                        title={r.description}
                      >
                        <div className="max-w-[10rem] mx-auto leading-tight line-clamp-3">{r.title}</div>
                        <div className="text-xs font-normal text-muted-foreground mt-1">tối đa {r.maxPoints}</div>
                      </th>
                    ))}
                    <th className="border border-slate-300 px-2 py-2 text-center font-medium whitespace-nowrap bg-slate-50">
                      Tổng
                    </th>
                    <th className="border border-slate-300 px-2 py-2 text-center font-medium min-w-[9rem]">
                      Bài làm
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((ent) => (
                    <tr key={ent.id} className="hover:bg-slate-50/80">
                      <td className="sticky left-0 z-[5] border border-slate-300 bg-white px-2 py-0 font-mono font-medium whitespace-nowrap">
                        {ent.studentCode}
                      </td>
                      {rubrics.map((r) => (
                        <td key={ent.id + r.id} className="border border-slate-300 p-0">
                          <input
                            type="number"
                            min={0}
                            max={r.maxPoints}
                            step={0.25}
                            aria-label={`${ent.studentCode} — ${r.title}`}
                            className="h-9 w-full min-w-[5rem] rounded-none border-0 bg-transparent px-2 font-mono tabular-nums text-sm shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                            value={scores[ent.id]?.[r.id] ?? ""}
                            onChange={(e) => setCell(ent.id, r.id, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="border border-slate-300 bg-slate-50/90 px-2 py-2 text-center font-mono tabular-nums font-medium">
                        {rowTotal(ent.id)}
                      </td>
                      <td className="border border-slate-300 px-1 py-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-normal"
                            onClick={() => downloadAssetListMock(ent.studentCode, ent.id)}
                          >
                            <Download className="size-3.5 mr-1" />
                            Tải DS file (mock)
                          </Button>
                          <Link to={`/submissions/${ent.id}/grade`} state={{ from: backHref }}>
                            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs w-full sm:w-auto">
                              Xem chi tiết
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                <Save className="size-4 mr-2" />
                {saving ? "Đang lưu…" : "Lưu điểm"}
              </Button>
              <Link to={backHref}>
                <Button type="button" variant="outline">
                  Hủy
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
