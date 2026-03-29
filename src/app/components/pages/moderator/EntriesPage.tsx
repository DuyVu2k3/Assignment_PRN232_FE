import { Link } from "react-router";
import {
  mockExams,
  mockSubmissionBatches,
  mockSubmissionEntries,
  mockSubmissionFiles,
  countAssetsForEntry,
  countViolationsForEntry,
} from "../../../data/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { ListOrdered } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function EntriesPage() {
  const rows = mockSubmissionEntries.map((entry) => {
    const exam = mockExams.find((e) => e.id === entry.examId);
    const batch = mockSubmissionBatches.find((b) => b.id === entry.submissionBatchId);
    const file = batch ? mockSubmissionFiles.find((f) => f.id === batch.submissionFileId) : undefined;
    const violN = countViolationsForEntry(entry.id);
    const assetN = countAssetsForEntry(entry.id);
    return { entry, exam, batch, file, violN, assetN };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Submission entries</h1>
        <p className="text-gray-600 mt-1">
          Mỗi dòng là một sinh viên sau khi batch được xử lý (giải nén từ file nộp). Kiểm tra số
          asset & violation trước khi chuyển cho chấm.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="size-5" />
            Danh sách entry (mock)
          </CardTitle>
          <CardDescription>
            Batch PRN232: file archive → nhiều thư mục MSSV → entries + assets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MSSV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Kỳ thi</TableHead>
                <TableHead>Batch / file gốc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Assets</TableHead>
                <TableHead>Vi phạm</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ entry, exam, batch, file, violN, assetN }) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-sm">{entry.studentCode}</TableCell>
                  <TableCell>{entry.studentName}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm">{exam?.title ?? "—"}</TableCell>
                  <TableCell className="text-xs max-w-[220px]">
                    <span className="text-gray-500">{batch?.id}</span>
                    <span className="block truncate text-gray-600" title={file?.originalFileName}>
                      {file?.originalFileName ?? "—"}
                    </span>
                    <span className="text-gray-400">
                      {batch ? format(new Date(batch.createdAt), "dd/MM/yyyy HH:mm", { locale: vi }) : ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{entry.status}</Badge>
                  </TableCell>
                  <TableCell>{assetN}</TableCell>
                  <TableCell>
                    {violN > 0 ? (
                      <Badge variant="warning">{violN}</Badge>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="link" className="px-0 h-auto" asChild>
                      <Link to="/violations">Xem vi phạm</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
