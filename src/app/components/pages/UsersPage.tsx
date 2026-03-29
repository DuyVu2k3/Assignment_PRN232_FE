import React, { useEffect, useMemo, useState } from "react";
import { usersService, type UserListItem } from "../../api/services";
import { useAuthStore } from "../../store/authStore";
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
import { Search, Mail, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function UsersPage() {
  const token = useAuthStore((state) => state.token);
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

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await usersService.getUsers({ pageNumber, pageSize, token: token ?? undefined });

        if (!isMounted) {
          return;
        }

        setUsers(result.data ?? []);
        setTotalItems(result.totalItems ?? 0);
        setTotalPages(result.totalPages ?? 0);
        setHasPrevious(Boolean(result.hasPrevious));
        setHasNext(Boolean(result.hasNext));
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setUsers([]);
        setErrorMessage(error instanceof Error ? error.message : "Không tải được danh sách người dùng");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [pageNumber, pageSize, token]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleCounts = useMemo(() => {
    return {
      admin: users.filter((u) => u.role === "Admin").length,
      manager: users.filter((u) => u.role === "Manager").length,
      examiner: users.filter((u) => u.role === "Examiner").length,
      moderator: users.filter((u) => u.role === "Moderator").length,
    };
  }, [users]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "Manager":
        return <Badge variant="default">Manager</Badge>;
      case "Examiner":
        return <Badge variant="secondary">Examiner</Badge>;
      case "Moderator":
        return <Badge variant="outline">Moderator</Badge>;
      default:
        return <Badge>{role}</Badge>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1>Quản lý Người dùng</h1>
          <p className="text-gray-600 mt-1">
            Quản lý người dùng và phân quyền trong hệ thống (dữ liệu từ API)
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-gray-400" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </TableCell>
                </TableRow>
              ))}
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy người dùng nào</p>
        </div>
      )}
    </div>
  );
}
