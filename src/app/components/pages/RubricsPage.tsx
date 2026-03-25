import { mockExams, getRubricsForExam } from "../../data/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ListChecks } from "lucide-react";

export function RubricsPage() {
  const prn = mockExams.find((e) => e.id === "exam-1");
  const rubrics = prn ? getRubricsForExam(prn.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rubric — tiêu chí chấm</h1>
        <p className="text-gray-600 mt-1">
          Rubric gắn với <strong>kỳ thi</strong> (Exam): Manager định nghĩa tiêu chí + điểm tối đa cho
          đợt đó (vd SU25 · Block 10w). Examiner chấm từng mục (vd Postman 1/2đ).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-5" />
            Ví dụ: {prn?.title ?? "PRN232 PE"}
          </CardTitle>
          <CardDescription>
            Môn {prn?.subject} — tổng điểm kỳ thi: <strong>{prn?.totalPoints ?? 0}</strong> (tổng max
            các rubric của kỳ này).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rubrics.map((r, i) => (
            <div
              key={r.id}
              className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border rounded-lg p-4"
            >
              <div>
                <p className="font-medium">
                  {i + 1}. {r.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">{r.description}</p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                Tối đa {r.maxPoints} đ
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-gray-500">
        Trang này sau khi có API sẽ thêm form thêm/sửa rubric và gắn vào ExamId.
      </p>
    </div>
  );
}
