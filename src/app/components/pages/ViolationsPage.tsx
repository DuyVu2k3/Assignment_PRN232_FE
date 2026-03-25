import React from "react";
import { mockExams, mockSubmissionAssets, mockSubmissionEntries, mockSubmissionViolations } from "../../data/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { AlertTriangle } from "lucide-react";

const severityVariant = (s: string) => {
  if (s === "error") return "destructive" as const;
  if (s === "warning") return "warning" as const;
  return "secondary" as const;
};

export function ViolationsPage() {
  const rows = mockSubmissionViolations.map((v) => {
    const entry = mockSubmissionEntries.find((e) => e.id === v.submissionEntryId);
    const exam = entry ? mockExams.find((e) => e.id === entry.examId) : undefined;
    const asset = v.submissionAssetId
      ? mockSubmissionAssets.find((a) => a.id === v.submissionAssetId)
      : null;
    return { v, entry, exam, asset };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vi phạm & cảnh báo</h1>
        <p className="text-gray-600 mt-1">
          Moderator kiểm tra kết quả pipeline sau giải nén (có thể gắn{" "}
          <code className="text-sm bg-muted px-1 rounded">SubmissionAssetId</code> khi lỗi thuộc
          một file cụ thể).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" />
            Danh sách (mock)
          </CardTitle>
          <CardDescription>
            Ví dụ PRN232 PE: thiếu Postman collection, cảnh báo path trong ZIP…
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mức</TableHead>
                <TableHead>MSSV / Entry</TableHead>
                <TableHead>Kỳ thi</TableHead>
                <TableHead>File liên quan</TableHead>
                <TableHead>Mô tả</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ v, entry, exam, asset }) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Badge variant={severityVariant(v.severity)}>{v.severity}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry ? (
                      <>
                        {entry.studentCode}
                        <span className="block text-xs text-gray-500 font-normal">{entry.studentName}</span>
                      </>
                    ) : (
                      v.submissionEntryId
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{exam?.title ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {asset ? (
                      <span className="font-mono text-xs">{asset.relativePath}</span>
                    ) : (
                      <span className="text-gray-400">— (entry-level)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 max-w-md">{v.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
