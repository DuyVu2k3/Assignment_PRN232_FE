import React, { useEffect, useState, type FormEvent } from "react";
import { HttpRequestError } from "../../api/http/requestJson";
import { semestersService, type Semester } from "../../api/services";
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
import { toast } from "sonner";

export type EditSemesterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = tạo mới; có giá trị = sửa */
  semester: Semester | null;
  onSuccess: (semester: Semester, mode: "create" | "edit") => void;
};

export function EditSemesterModal({ open, onOpenChange, semester, onSuccess }: EditSemesterModalProps) {
  const isCreate = semester === null;
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (semester) {
      setName(semester.name);
      setStartDate(semester.startDate.slice(0, 10));
      setEndDate(semester.endDate.slice(0, 10));
    } else {
      setName("");
      setStartDate("");
      setEndDate("");
    }
  }, [open, semester]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !startDate || !endDate) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
      return;
    }

    const payload = {
      name: name.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    };

    setIsSubmitting(true);
    try {
      if (isCreate) {
        const created = await semestersService.createSemester(payload);
        onSuccess(created, "create");
        toast.success("Tạo học kỳ thành công");
      } else {
        const updated = await semestersService.updateSemester(semester.id, payload);
        onSuccess(updated, "edit");
        toast.success("Cập nhật học kỳ thành công");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof HttpRequestError
          ? error.message
          : isCreate
            ? "Tạo học kỳ thất bại"
            : "Cập nhật học kỳ thất bại"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Tạo học kỳ" : "Sửa học kỳ"}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Nhập thông tin học kỳ mới."
              : `Cập nhật thông tin học kỳ #${semester.id}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="semester-form-name">Tên học kỳ</Label>
            <Input
              id="semester-form-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Spring 2026"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="semester-form-start">Ngày bắt đầu</Label>
              <Input
                id="semester-form-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester-form-end">Ngày kết thúc</Label>
              <Input
                id="semester-form-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
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
