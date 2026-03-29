import React, { useCallback, useMemo, useState } from "react";
import type { SolutionAttachment, SolutionFileEntry } from "../../api/services/submissionSolutionsService";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ChevronDown, ChevronRight, Download, File, Folder, Paperclip } from "lucide-react";

export interface TreeNode {
  name: string;
  fullPath: string;
  isDirectory: boolean;
  size: number;
  children: TreeNode[];
}

export function buildSolutionFileTree(files: SolutionFileEntry[]): TreeNode {
  const root: TreeNode = { name: "", fullPath: "", children: [], isDirectory: true, size: 0 };
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path, "vi", { sensitivity: "base" }));

  for (const f of sorted) {
    const parts = f.path.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    let current = root;
    let acc = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      acc = acc ? `${acc}/${part}` : part;
      const isLast = i === parts.length - 1;

      let child = current.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          fullPath: acc,
          children: [],
          isDirectory: isLast ? f.isDirectory : true,
          size: isLast ? f.size : 0,
        };
        current.children.push(child);
      } else if (isLast) {
        child.isDirectory = f.isDirectory;
        child.size = f.size;
      }
      current = child;
    }
  }

  const sortRec = (n: TreeNode) => {
    n.children.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name, "vi", { sensitivity: "base" });
    });
    for (const c of n.children) sortRec(c);
  };
  sortRec(root);

  return root;
}

function formatBytes(n: number): string {
  if (n <= 0) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${u[i]}`;
}

type NodeRowProps = {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (fullPath: string) => void;
  onDownloadFile: (filePath: string) => void;
};

function filterNode(node: TreeNode, q: string): TreeNode | null {
  if (!q.trim()) {
    return node;
  }
  const low = q.trim().toLowerCase();
  const selfMatch =
    node.fullPath.toLowerCase().includes(low) || node.name.toLowerCase().includes(low);

  if (!node.isDirectory) {
    return selfMatch ? node : null;
  }

  const nextChildren: TreeNode[] = [];
  for (const c of node.children) {
    const sub = filterNode(c, q);
    if (sub) nextChildren.push(sub);
  }

  if (selfMatch || nextChildren.length > 0) {
    return { ...node, children: nextChildren };
  }
  return null;
}

function NodeRow({ node, depth, expanded, onToggle, onDownloadFile, filter }: NodeRowProps) {
  if (node.name === "" && node.fullPath === "") {
    return (
      <ul className="list-none space-y-0.5">
        {node.children.map((c) => (
          <NodeRow
            key={c.fullPath}
            node={c}
            depth={0}
            expanded={expanded}
            onToggle={onToggle}
            onDownloadFile={onDownloadFile}
          />
        ))}
      </ul>
    );
  }

  const pad = 8 + depth * 14;

  if (node.isDirectory) {
    const open = expanded.has(node.fullPath);
    return (
      <li className="select-none">
        <div
          className={cn(
            "flex items-center gap-1 rounded-md py-1 pr-2 text-sm hover:bg-muted/60",
            "min-h-8"
          )}
          style={{ paddingLeft: pad }}
        >
          <button
            type="button"
            className="shrink-0 rounded p-0.5 hover:bg-muted"
            aria-expanded={open}
            onClick={() => onToggle(node.fullPath)}
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
          <Folder className="size-4 shrink-0 text-amber-600" />
          <span className="truncate font-medium">{node.name}</span>
        </div>
        {open && node.children.length > 0 ? (
          <ul className="list-none">
            {node.children.map((c) => (
              <NodeRow
                key={c.fullPath}
                node={c}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                onDownloadFile={onDownloadFile}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <li className="select-none">
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-md py-1 pr-2 hover:bg-muted/60 min-h-8"
        style={{ paddingLeft: pad + 18 }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <File className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-mono text-xs" title={node.fullPath}>
            {node.name}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatBytes(node.size)}</span>
        </div>
        <Button type="button" size="sm" variant="outline" className="shrink-0" onClick={() => onDownloadFile(node.fullPath)}>
          <Download className="size-3.5" />
          Tải
        </Button>
      </div>
    </li>
  );
}

export interface SolutionFilesExplorerProps {
  solutionFiles: SolutionFileEntry[];
  attachments: SolutionAttachment[];
  loading?: boolean;
  onDownloadSolutionFile: (filePath: string) => void | Promise<void>;
  onDownloadAttachment: (assetId: number, fileName: string) => void | Promise<void>;
  onDownloadAllFiles?: () => void | Promise<void>;
}

export function SolutionFilesExplorer({
  solutionFiles,
  attachments,
  loading,
  onDownloadSolutionFile,
  onDownloadAttachment,
  onDownloadAllFiles,
}: SolutionFilesExplorerProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState("");

  const tree = useMemo(() => buildSolutionFileTree(solutionFiles), [solutionFiles]);

  const filteredTree = useMemo(() => {
    if (!filter.trim()) return tree;
    return filterNode(tree, filter);
  }, [tree, filter]);

  const toggle = useCallback((fullPath: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(fullPath)) next.delete(fullPath);
      else next.add(fullPath);
      return next;
    });
  }, []);

  const fileOnlyCount = useMemo(
    () => solutionFiles.filter((f) => !f.isDirectory).length,
    [solutionFiles]
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Đang tải cây file…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="max-w-sm"
          placeholder="Lọc theo tên / đường dẫn…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        {onDownloadAllFiles && fileOnlyCount > 0 ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => void onDownloadAllFiles()}>
            <Download className="size-4" />
            Tải tất cả ({fileOnlyCount} file → 1 ZIP)
          </Button>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-2 max-h-[min(70vh,560px)] overflow-auto">
        {solutionFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-4">Không có mục nào trong solution.</p>
        ) : filteredTree == null || filteredTree.children.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-4">Không có mục nào khớp bộ lọc.</p>
        ) : (
          <NodeRow
            node={filteredTree}
            depth={0}
            expanded={expanded}
            onToggle={toggle}
            onDownloadFile={(p) => void onDownloadSolutionFile(p)}
          />
        )}
      </div>

      {attachments.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Paperclip className="size-4" />
            File đính kèm ({attachments.length})
          </h4>
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li
                key={a.assetId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.fileName}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate" title={a.relativePath}>
                    {a.relativePath}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatBytes(a.size)}</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void onDownloadAttachment(a.assetId, a.fileName)}
                >
                  <Download className="size-4" />
                  Tải
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
