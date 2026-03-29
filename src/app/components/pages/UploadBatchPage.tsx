import { EXAMPLE_PRN232_ARCHIVE_NAME } from "../../data/mockData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { UploadCloud, FileArchive } from "lucide-react";

export function UploadBatchPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Upload batch</h1>
        <p className="text-gray-600 mt-1">
          Batch được gắn với một <strong>kỳ thi</strong> (vd PE PRN232 · SU25 · Block 10w). Moderator
          nộp .zip/.rar theo MSSV; hệ thống tạo <strong>SubmissionFiles</strong> →{" "}
          <strong>SubmissionBatches</strong> → giải nén <strong>SubmissionEntries</strong> /{" "}
          <strong>SubmissionAssets</strong>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileArchive className="size-5" />
            Ví dụ tên file (PRN232 PE)
          </CardTitle>
          <CardDescription className="font-mono text-xs break-all">
            {EXAMPLE_PRN232_ARCHIVE_NAME}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Trong tên thường có block/lớp và danh sách nhóm MSSV; sau xử lý, mỗi MSSV (SE1728,
            SE1729, …) là một <strong>entry</strong> để Moderator xem asset & violation trước khi
            chấm.
          </p>
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500 bg-muted/30">
            <UploadCloud className="size-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-4">Kéo thả file hoặc chọn từ máy (mock — chưa gọi API)</p>
            <Button type="button" disabled>
              Chọn .zip / .rar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
