import { PlaceholderShell } from "./PlaceholderShell";

export function RolesPermissionsPage() {
  return (
    <PlaceholderShell
      title="Vai trò & quyền"
      description="Danh sách role và permission (nếu backend hỗ trợ)."
      apiHint="GET roles/permissions — chỉ đọc hoặc chỉnh sửa tùy policy."
    />
  );
}
