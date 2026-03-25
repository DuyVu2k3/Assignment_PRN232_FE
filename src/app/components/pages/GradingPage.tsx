import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { mockSubmissions, mockExams } from "../../data/mockData";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft, User, FileText, Calendar, Save } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function GradingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const submission = mockSubmissions.find((s) => s.id === id);
  const exam = submission
    ? mockExams.find((e) => e.id === submission.examId)
    : null;

  const [score, setScore] = useState(submission?.score?.toString() || "");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!submission || !exam) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy bài nộp</p>
        <Link to="/submissions">
          <Button variant="outline" className="mt-4">
            Quay lại
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // In production, this would call the GradeSubmission API
    console.log("Grading submission:", {
      submissionId: id,
      score: parseFloat(score),
      feedback,
    });

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/submissions");
    }, 1000);
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
          <h1>Chấm điểm bài thi</h1>
          <p className="text-gray-600 mt-1">
            Chấm điểm và đánh giá bài thi của học sinh
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin bài thi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="size-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Học sinh</p>
                    <p className="font-medium">{submission.studentName}</p>
                    <p className="text-sm text-gray-500">
                      Mã: {submission.studentId}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="size-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Đề thi</p>
                    <p className="font-medium">{exam.title}</p>
                    <p className="text-sm text-gray-500">Môn: {exam.subject}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="size-5 text-gray-400" />
                  <p className="text-sm text-gray-500">Thời gian nộp bài</p>
                </div>
                <p className="font-medium">
                  {format(new Date(submission.submittedAt), "dd/MM/yyyy HH:mm:ss", {
                    locale: vi,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bài làm của học sinh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
                <div>
                  <FileText className="size-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Tệp bài làm sẽ được hiển thị ở đây
                  </p>
                  <Button variant="outline">
                    Tải xuống bài làm
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Chấm điểm</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="score">
                    Điểm số <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="score"
                      type="number"
                      min="0"
                      max={exam.totalPoints}
                      step="0.5"
                      placeholder={`0 - ${exam.totalPoints}`}
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                      / {exam.totalPoints}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Điểm tối đa: {exam.totalPoints}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Nhận xét</Label>
                  <Textarea
                    id="feedback"
                    placeholder="Nhập nhận xét về bài làm của học sinh..."
                    rows={6}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    <Save className="size-4 mr-2" />
                    {isSubmitting ? "Đang lưu..." : "Lưu điểm"}
                  </Button>
                  <Link to="/submissions" className="block">
                    <Button type="button" variant="outline" className="w-full">
                      Hủy
                    </Button>
                  </Link>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 Lưu ý: Điểm số sẽ được lưu vào hệ thống và không thể
                    thay đổi sau khi xác nhận.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
