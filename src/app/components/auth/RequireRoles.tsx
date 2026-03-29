import React from "react";
import { Navigate } from "react-router";
import { useAuthStore } from "../../store/authStore";
import type { UserRole } from "../../api/services/authService";

type RequireRolesProps = {
  roles: readonly UserRole[];
  children: React.ReactNode;
};

/**
 * Bảo vệ route theo role (UI). Backend vẫn phải kiểm tra policy/JWT.
 * Khớp menu trong RootLayout.
 */
export function RequireRoles({ roles, children }: RequireRolesProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return null;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
