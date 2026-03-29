import { useState } from "react";
import { Link } from "react-router";
import { formatExamPeriod, mockExams } from "../../data/mockData";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Plus, Search, Clock, Users } from "lucide-react";

export function ExamListPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExams = mockExams.filter((exam) => {
    const q = searchQuery.toLowerCase();
    return (
      exam.title.toLowerCase().includes(q) ||
      exam.subject.toLowerCase().includes(q) ||
      (exam.courseCode?.toLowerCase().includes(q) ?? false) ||
      formatExamPeriod(exam).toLowerCase().includes(q)
    );
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "success";
      case "Draft":
        return "warning";
      case "Archived":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Quản lý kỳ thi (Exam)</h1>
          <p className="text-gray-600 mt-1">
            Mỗi bản ghi là một <strong>kỳ thi</strong> (vd PRN232 PE · SU25 · Block 10w; FA25 ·
            Giữa kỳ…) — không phải mã đề.
          </p>
        </div>
        <Link to="/exams/new">
          <Button>
            <Plus className="size-4 mr-2" />
            Tạo kỳ thi mới
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Tìm môn, đợt SU25/FA25, Block, tên kỳ thi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredExams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{exam.title}</h3>
                    <Badge variant={getStatusVariant(exam.status)}>
                      {exam.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{exam.description}</p>
                  <p className="text-sm text-gray-500">
                    Môn: {exam.courseCode ?? exam.subject}
                  </p>
                  <p className="text-xs font-medium text-gray-700 mt-1">
                    Đợt kỳ thi: {formatExamPeriod(exam)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-gray-400" />
                  <span>{exam.duration} phút</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4 text-gray-400" />
                  <span>{exam.examinerUserIds.length} giám khảo (ExamExaminers)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/exams/${exam.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Xem chi tiết
                  </Button>
                </Link>
                <Button variant="secondary">
                  Phân công
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExams.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy kỳ thi nào</p>
        </div>
      )}
    </div>
  );
}
