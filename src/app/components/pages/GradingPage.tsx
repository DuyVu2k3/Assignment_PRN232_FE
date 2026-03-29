import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router";
import {
  getAssetsForEntry,
  getRubricsForExam,
  mockGradeRubricScores,
  mockSubmissions,
  mockExams,
} from "../../data/mockData";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft, User, FileText, Calendar, Save, ListChecks, Download } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

type GradeNavState = { from?: string };

export function GradingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backHref = (location.state as GradeNavState | null)?.from ?? "/submissions";
  const submission = mockSubmissions.find((s) => s.id === id);
  const exam = submission ? mockExams.find((e) => e.id === submission.examId) : null;
  const rubrics = exam ? getRubricsForExam(exam.id) : [];
  const assets = id ? getAssetsForEntry(id) : [];

  const initialRubricScores = useMemo(() => {
    if (!id) return {} as Record<string, string>;
    const map: Record<string, string> = {};
    for (const row of mockGradeRubricScores.filter((s) => s.submissionEntryId === id)) {
      map[row.rubricId] = String(row.score);
    }
    return map;
  }, [id]);

  const [rubricScores, setRubricScores] = useState<Record<string, string>>(initialRubricScores);
  const [score, setScore] = useState(submission?.score?.toString() ?? "");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRubricScores(initialRubricScores);
    setScore(submission?.score?.toString() ?? "");
    setFeedback("");
  }, [id, initialRubricScores, submission?.score]);

  const useRubricMode = rubrics.length > 0;

  const rubricTotal = useMemo(() => {
    let t = 0;
    for (const r of rubrics) {
      const raw = rubricScores[r.id];
      if (raw === undefined || raw === "") continue;
      const n = parseFloat(raw);
      if (!Number.isNaN(n)) t += n;
    }
    return t;
  }, [rubrics, rubricScores]);

  if (!submission || !exam) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy bài nộp (SubmissionEntry)</p>
        <Link to="/submissions">
          <Button variant="outline" className="mt-4">
            Quay lại
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (useRubricMode) {
      const payload = rubrics.map((r) => ({
        rubricId: r.id,
        title: r.title,
        maxPoints: r.maxPoints,
        score: parseFloat(rubricScores[r.id] || "0"),
      }));
      console.log("Grade rubric scores (POST grade_entries / rubric):", {
        submissionEntryId: id,
        items: payload,
        notes: feedback,
      });
    } else {
      console.log("Grade (legacy tổng điểm):", {
        submissionEntryId: id,
        score: parseFloat(score),
        feedback,
      });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      navigate(backHref);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link to="/submissions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1>Chấm điểm</h1>
          <p className="text-gray-600 mt-1">
            {useRubricMode
              ? "Theo từng tiêu chí rubric (vd: Postman tối đa 2đ — nhập 1đ nếu chỉ đạt một phần)"
              : "Tổng điểm một lần"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin bài</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="size-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Sinh viên</p>
                    <p className="font-medium">{submission.studentName}</p>
                    <p className="text-sm text-gray-500">MSSV: {submission.studentId}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="size-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Kỳ thi</p>
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-sm text-gray-500">Môn: {exam.courseCode ?? exam.subject}</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t flex items-center gap-3">
                <Calendar className="size-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Entry tạo sau giải nén batch</p>
                  <p className="font-medium">
                    {format(new Date(submission.submittedAt), "dd/MM/yyyy HH:mm:ss", {
                      locale: vi,
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bài làm (assets)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  File giải nén trong batch (mock) — examiner tải về hoặc mở IDE để xét bài.
                </p>
                {assets.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    Chưa có asset cho entry này.
                  </div>
                ) : (
                  <ul className="border rounded-lg divide-y text-sm max-h-[280px] overflow-y-auto">
                    {assets.map((a) => (
                      <li key={a.id} className="px-3 py-2 flex justify-between gap-2 items-start">
                        <span className="font-mono text-xs break-all">{a.relativePath}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{a.kind}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  variant="outline"
                  type="button"
                  disabled={assets.length === 0}
                  onClick={() => {
                    const lines = [
                      `StudentCode\t${submission.studentId}`,
                      "",
                      "fileName\trelativePath\tkind",
                      ...assets.map((a) => `${a.fileName}\t${a.relativePath}\t${a.kind}`),
                    ];
                    const blob = new Blob([lines.join("\n")], {
                      type: "text/plain;charset=utf-8",
                    });
                    const url = URL.createObjectURL(blob);
                    const el = document.createElement("a");
                    el.href = url;
                    el.download = `${submission.studentId}_PRN232_assets.txt`;
                    el.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="size-4 mr-2" />
                  Tải danh sách file (mock .txt)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="size-5" />
                {useRubricMode ? "Điểm theo rubric" : "Điểm tổng"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {useRubricMode ? (
                  <>
                    {rubrics.map((r) => (
                      <div key={r.id} className="space-y-2">
                        <Label htmlFor={`rub-${r.id}`}>
                          {r.title}{" "}
                          <span className="text-gray-500 font-normal">
                            (tối đa {r.maxPoints} đ)
                          </span>
                        </Label>
                        <p className="text-xs text-gray-500">{r.description}</p>
                        <Input
                          id={`rub-${r.id}`}
                          type="number"
                          min={0}
                          max={r.maxPoints}
                          step={0.5}
                          placeholder={`0 – ${r.maxPoints}`}
                          value={rubricScores[r.id] ?? ""}
                          onChange={(e) =>
                            setRubricScores((prev) => ({ ...prev, [r.id]: e.target.value }))
                          }
                        />
                      </div>
                    ))}
                    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                      <span className="text-gray-600">Tổng tạm tính: </span>
                      <span className="font-semibold">{rubricTotal}</span>
                      <span className="text-gray-500"> / {exam.totalPoints}</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="score">
                      Điểm số <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="score"
                        type="number"
                        min={0}
                        max={exam.totalPoints}
                        step={0.5}
                        placeholder={`0 - ${exam.totalPoints}`}
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        / {exam.totalPoints}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="feedback">Nhận xét</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Ghi chú cho SV hoặc ghi nhận vi phạm đã bỏ qua…"
                    rows={5}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <Save className="size-4 mr-2" />
                    {isSubmitting ? "Đang lưu..." : "Lưu chấm"}
                  </Button>
                  <Link to={backHref} className="block">
                    <Button type="button" variant="outline" className="w-full">
                      Hủy
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
