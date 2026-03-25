import { useState } from "react";
import { mockUsers } from "../../data/mockData";
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
import { Plus, Search, Mail, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return <Badge variant="destructive">Admin</Badge>;
      case "Manager":
        return <Badge variant="default">Manager</Badge>;
      case "Examiner":
        return <Badge variant="secondary">Examiner</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const stats = [
    {
      label: "Tổng người dùng",
      value: mockUsers.length,
      icon: UserCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Admin",
      value: mockUsers.filter((u) => u.role === "Admin").length,
      icon: UserCheck,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Manager",
      value: mockUsers.filter((u) => u.role === "Manager").length,
      icon: UserCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Examiner",
      value: mockUsers.filter((u) => u.role === "Examiner").length,
      icon: UserCheck,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Quản lý Người dùng</h1>
          <p className="text-gray-600 mt-1">
            Quản lý người dùng và phân quyền trong hệ thống
          </p>
        </div>
        <Button>
          <Plus className="size-4 mr-2" />
          Thêm người dùng
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Đề thi được phân công</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Thao tác</TableHead>
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
                    {user.role === "Examiner" ? (
                      <span className="font-medium">{user.assignedExams}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Chỉnh sửa
                      </Button>
                      {user.role === "Examiner" && (
                        <Button variant="ghost" size="sm">
                          Phân công
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
