import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ArrowLeft } from "lucide-react";

const subjects = [
  "Toán học",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Tiếng Anh",
  "Văn học",
  "Lịch sử",
  "Địa lý",
];

export function CreateExamPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    totalPoints: "100",
    duration: "90",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would call the CreateExam API
    console.log("Creating exam:", formData);
    // Simulate API call
    setTimeout(() => {
      navigate("/exams");
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/exams">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <div>
          <h1>Tạo đề thi mới</h1>
          <p className="text-gray-600 mt-1">
            Điền thông tin để tạo đề thi mới
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin đề thi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Tên đề thi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="VD: Kỳ thi giữa kỳ môn Toán học"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">
                Môn học <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.subject}
                onValueChange={(value) =>
                  setFormData({ ...formData, subject: value })
                }
                required
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả chi tiết về đề thi..."
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalPoints">
                  Tổng điểm <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="totalPoints"
                  type="number"
                  min="0"
                  value={formData.totalPoints}
                  onChange={(e) =>
                    setFormData({ ...formData, totalPoints: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">
                  Thời gian (phút) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <Button type="submit">Tạo đề thi</Button>
              <Link to="/exams">
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
