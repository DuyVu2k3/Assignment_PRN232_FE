import { useState } from "react";
import { Link } from "react-router";
import { mockSubmissions } from "../../data/mockData";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Upload, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function SubmissionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSubmissions = mockSubmissions.filter((submission) => {
    const matchesSearch =
      submission.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.examTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || submission.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="warning">Chờ chấm</Badge>;
      case "Grading":
        return <Badge variant="default">Đang chấm</Badge>;
      case "Graded":
        return <Badge variant="success">Đã chấm</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const stats = [
    {
      label: "Tổng bài nộp",
      value: mockSubmissions.length,
      color: "text-blue-600",
    },
    {
      label: "Chờ chấm",
      value: mockSubmissions.filter((s) => s.status === "Pending").length,
      color: "text-orange-600",
    },
    {
      label: "Đang chấm",
      value: mockSubmissions.filter((s) => s.status === "Grading").length,
      color: "text-blue-600",
    },
    {
      label: "Đã chấm",
      value: mockSubmissions.filter((s) => s.status === "Graded").length,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Quản lý Bài thi</h1>
          <p className="text-gray-600 mt-1">
            Xem và chấm điểm các bài thi đã nộp
          </p>
        </div>
        <Button>
          <Upload className="size-4 mr-2" />
          Upload bài thi hàng loạt
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tên, mã học sinh, đề thi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="Pending">Chờ chấm</SelectItem>
            <SelectItem value="Grading">Đang chấm</SelectItem>
            <SelectItem value="Graded">Đã chấm</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Download className="size-4 mr-2" />
          Xuất báo cáo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bài nộp</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã học sinh</TableHead>
                <TableHead>Tên học sinh</TableHead>
                <TableHead>Đề thi</TableHead>
                <TableHead>Thời gian nộp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.studentId}
                  </TableCell>
                  <TableCell>{submission.studentName}</TableCell>
                  <TableCell>{submission.examTitle}</TableCell>
                  <TableCell>
                    {format(new Date(submission.submittedAt), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>
                    {submission.score !== undefined ? (
                      <span className="font-medium">{submission.score}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {submission.status !== "Graded" && (
                        <Link to={`/submissions/${submission.id}/grade`}>
                          <Button variant="outline" size="sm">
                            Chấm điểm
                          </Button>
                        </Link>
                      )}
                      <Button variant="ghost" size="sm">
                        Xem
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredSubmissions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy bài nộp nào</p>
        </div>
      )}
    </div>
  );
}
