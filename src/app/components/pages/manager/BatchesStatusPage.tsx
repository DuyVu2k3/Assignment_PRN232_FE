import { Link } from "react-router";
import {
  formatExamPeriod,
  getSubmissionFileById,
  mockExams,
  mockSubmissionBatches,
} from "../../../data/mockData";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Table2 } from "lucide-react";

export function BatchesStatusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trạng thái batch</h1>
        <p className="text-gray-600 mt-1 text-sm">
          Demo PRN232 — batch sau khi Moderator upload; Manager mở bảng chấm theo rubric khi batch
          đã Ready.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Table2 className="size-5" />
            Batch (mock)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Kỳ thi</TableHead>
                <TableHead>File gốc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSubmissionBatches.map((b) => {
                const exam = mockExams.find((e) => e.id === b.examId);
                const file = getSubmissionFileById(b.submissionFileId);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono">{b.id}</TableCell>
                    <TableCell>
                      {exam ? (
                        <span>
                          {exam.title}
                          <span className="block text-xs text-muted-foreground">
                            {formatExamPeriod(exam)}
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-xs" title={file?.originalFileName}>
                      {file?.originalFileName ?? "—"}
                    </TableCell>
                    <TableCell>{b.status}</TableCell>
                    <TableCell>
                      <Link to={`/batches/${b.id}/grade`} state={{ from: "/batches" }}>
                        <Button variant="outline" size="sm" type="button">
                          Bảng chấm rubric
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
