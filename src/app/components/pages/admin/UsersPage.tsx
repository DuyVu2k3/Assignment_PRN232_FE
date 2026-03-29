import React, { useCallback, useEffect, useMemo, useState } from "react";
import { authService, usersService, type UserListItem } from "../../../api/services";
import { HttpRequestError } from "../../../api/http/requestJson";
import { UserRole } from "../../../types/enums";
import { useAuthStore } from "../../../store/authStore";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Search, Mail, UserCheck, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

export function UsersPage() {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: UserRole.Examiner,
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await usersService.getUsers({ pageNumber, pageSize, token: token ?? undefined });
      setUsers(result.data ?? []);
      setTotalItems(result.totalItems ?? 0);
      setTotalPages(result.totalPages ?? 0);
      setHasPrevious(Boolean(result.hasPrevious));
      setHasNext(Boolean(result.hasNext));
    } catch (error) {
      setUsers([]);
      setErrorMessage(error instanceof Error ? error.message : "Không tải được danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, token]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(user.role).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleCounts = useMemo(() => {
    return {
      admin: users.filter((u) => u.role === UserRole.Admin).length,
      manager: users.filter((u) => u.role === UserRole.Manager).length,
      examiner: users.filter((u) => u.role === UserRole.Examiner).length,
      moderator: users.filter((u) => u.role === UserRole.Moderator).length,
    };
  }, [users]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case UserRole.Admin:
        return <Badge variant="destructive">Admin</Badge>;
      case UserRole.Manager:
        return <Badge variant="default">Manager</Badge>;
      case UserRole.Examiner:
        return <Badge variant="secondary">Examiner</Badge>;
      case UserRole.Moderator:
        return <Badge variant="outline">Moderator</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const isSameUser = (row: UserListItem) =>
    currentUser != null && String(currentUser.id) === String(row.id);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addForm.password.length < 6) {
      toast.error("Mật khẩu tối thiểu 6 ký tự");
      return;
    }

    setAddSubmitting(true);
    try {
      await authService.createUser({
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        role: addForm.role,
      });
      toast.success("Đã tạo người dùng");
      setAddOpen(false);
      setAddForm({ name: "", email: "", password: "", role: UserRole.Examiner });
      setPageNumber(1);
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof HttpRequestError ? err.message : "Tạo người dùng thất bại");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleToggleActive = async (row: UserListItem) => {
    const next = !row.isActive;
    setTogglingUserId(row.id);
    try {
      await usersService.updateUserStatus(row.id, next);
      toast.success(next ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hóa tài khoản");
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof HttpRequestError ? err.message : "Cập nhật trạng thái thất bại");
    } finally {
      setTogglingUserId(null);
    }
  };

  const stats = [
    {
      label: "Tổng người dùng",
      value: totalItems,
      icon: UserCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Admin",
      value: roleCounts.admin,
      icon: UserCheck,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Manager",
      value: roleCounts.manager,
      icon: UserCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Examiner",
      value: roleCounts.examiner,
      icon: UserCheck,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
    {
      label: "Moderator",
      value: roleCounts.moderator,
      icon: UserCheck,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>Quản lý Người dùng</h1>
          <p className="text-gray-600 mt-1">
            Thêm user (POST /api/auth/users); kích hoạt / vô hiệu hóa:{" "}
            <span className="font-mono text-xs">PATCH /api/users/{"{id}"}/status</span> với{" "}
            <span className="font-mono text-xs">{"{ isActive: true }"}</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <stat.icon className={`size-4 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-2xl ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 w-full">
        <div className="relative flex-1 min-w-[12rem] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Input
            type="number"
            min={1}
            max={100}
            value={pageSize}
            onChange={(e) => setPageSize(Math.max(1, Number(e.target.value) || 10))}
            className="w-24"
          />
          <span className="text-sm text-gray-500">mỗi trang</span>
        </div>

        <div className="ml-auto shrink-0">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button type="button">
                <UserPlus className="size-4 mr-2" />
                Thêm người dùng
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle>Thêm người dùng</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-name">Họ tên</Label>
                    <Input
                      id="add-name"
                      value={addForm.name}
                      onChange={(e) => setAddForm((s) => ({ ...s, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-email">Email</Label>
                    <Input
                      id="add-email"
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm((s) => ({ ...s, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-password">Mật khẩu</Label>
                    <Input
                      id="add-password"
                      type="password"
                      minLength={6}
                      value={addForm.password}
                      onChange={(e) => setAddForm((s) => ({ ...s, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vai trò</Label>
                    <Select
                      value={addForm.role}
                      onValueChange={(v) => setAddForm((s) => ({ ...s, role: v as UserRole }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.Examiner}>Examiner</SelectItem>
                        <SelectItem value={UserRole.Manager}>Manager</SelectItem>
                        <SelectItem value={UserRole.Moderator}>Moderator</SelectItem>
                        <SelectItem value={UserRole.Admin}>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={addSubmitting}>
                    {addSubmitting ? "Đang tạo…" : "Tạo"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-gray-500 mb-4">Đang tải dữ liệu...</p> : null}
          {errorMessage ? <p className="text-sm text-red-600 mb-4">{errorMessage}</p> : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Kích hoạt</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right w-[200px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const busy = togglingUserId === user.id;
                const self = isSameUser(user);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-gray-400 shrink-0" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(String(user.role))}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Đang hoạt động" : "Đã khóa"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.isActive ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy || self}
                          title={self ? "Không thể tự vô hiệu hóa chính mình" : undefined}
                          onClick={() => void handleToggleActive(user)}
                        >
                          {busy ? "…" : "Vô hiệu hóa"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => void handleToggleActive(user)}
                        >
                          {busy ? "…" : "Kích hoạt"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Trang {pageNumber}/{Math.max(totalPages, 1)} - Tổng {totalItems} người dùng
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrevious || isLoading}
                onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasNext || isLoading}
                onClick={() => setPageNumber((prev) => prev + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy người dùng nào</p>
        </div>
      )}
    </div>
  );
}
