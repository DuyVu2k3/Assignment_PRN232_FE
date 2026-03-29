import React, { useEffect, useMemo, useState, type FormEvent } from "react";
import { HttpRequestError } from "../../api/http/requestJson";
import { examsService, semestersService, type Exam, type Semester } from "../../api/services";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";

const toDateTimeLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  // datetime-local hiển thị theo local time, nên cần bù timezone offset.
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

export type EditExamModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = tạo mới; có giá trị = sửa */
  exam: Exam | null;
  onSuccess: (exam: Exam, mode: "create" | "edit") => void;
};

export function EditExamModal({ open, onOpenChange, exam, onSuccess }: EditExamModalProps) {
  const isCreate = useMemo(() => exam === null, [exam]);

  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [semesterId, setSemesterId] = useState("");

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (exam) {
      setTitle(exam.title);
      setDueDate(toDateTimeLocal(exam.dueDate));
      setSemesterId(String(exam.semesterId));
    } else {
      setTitle("");
      setDueDate("");
      setSemesterId("");
    }
  }, [open, exam]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const load = async () => {
      setIsLoadingSemesters(true);
      try {
        const data = await semestersService.getSemesters();
        setSemesters(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không tải được học kỳ");
        setSemesters([]);
      } finally {
        setIsLoadingSemesters(false);
      }
    };

    void load();
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !dueDate || !semesterId) {
      toast.error("Vui lòng nhập đầy đủ thông tin kỳ thi");
      return;
    }

    const semesterIdNum = Number(semesterId);
    if (!Number.isInteger(semesterIdNum) || semesterIdNum <= 0) {
      toast.error("Học kỳ không hợp lệ");
      return;
    }

    const payload = {
      title: title.trim(),
      dueDate: new Date(dueDate).toISOString(),
      semesterId: semesterIdNum,
    };

    setIsSubmitting(true);
    try {
      if (isCreate) {
        const created = await examsService.createExam(payload);
        onSuccess(created, "create");
        toast.success("Tạo kỳ thi thành công");
      } else {
        const updated = await examsService.updateExam(exam!.id, payload);
        onSuccess(updated, "edit");
        toast.success("Cập nhật kỳ thi thành công");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof HttpRequestError ? error.message : isCreate ? "Tạo kỳ thi thất bại" : "Cập nhật kỳ thi thất bại"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Tạo kỳ thi" : "Sửa kỳ thi"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "Nhập thông tin kỳ thi mới." : `Cập nhật thông tin kỳ thi #${exam?.id}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="exam-form-title">Tên kỳ thi</Label>
            <Input
              id="exam-form-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: PE PRN232 - SU26"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam-form-semester">Học kỳ</Label>
            <Select value={semesterId} onValueChange={setSemesterId}>
              <SelectTrigger id="exam-form-semester" disabled={isLoadingSemesters}>
                <SelectValue
                  placeholder={isLoadingSemesters ? "Đang tải học kỳ..." : "Chọn học kỳ"}
                />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam-form-dueDate">Hạn nộp</Label>
            <Input
              id="exam-form-dueDate"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isCreate ? "Đang tạo..." : "Đang lưu...") : isCreate ? "Tạo" : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

