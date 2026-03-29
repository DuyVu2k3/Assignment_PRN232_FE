import { PlaceholderShell } from "./PlaceholderShell";

export function AssignExaminerByExamPage() {
  return (
    <PlaceholderShell
      title="Gán examiner theo đề"
      description="Chọn kỳ thi (Exam) và gán giám khảo cho đợt đó."
      primaryActionLabel="Gán mới"
      apiHint="Assignment theo Exam — map examiner ↔ exam."
    />
  );
}
