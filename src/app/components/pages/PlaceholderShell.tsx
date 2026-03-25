import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

type PlaceholderShellProps = {
  title: string;
  description: string;
  apiHint?: string;
  primaryActionLabel?: string;
};

export function PlaceholderShell({
  title,
  description,
  apiHint = "Kết nối API sẽ được thêm sau.",
  primaryActionLabel,
}: PlaceholderShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        {primaryActionLabel ? (
          <Button disabled className="shrink-0">
            {primaryActionLabel}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Tìm kiếm..." className="max-w-sm" disabled />
        <Button variant="outline" disabled>
          Bộ lọc
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dữ liệu</CardTitle>
          <CardDescription>{apiHint}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
