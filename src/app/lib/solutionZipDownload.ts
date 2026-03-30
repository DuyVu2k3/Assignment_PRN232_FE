import JSZip from "jszip";

const sanitizeSegment = (name: string): string => name.replace(/[/\\?%*:|"<>]/g, "_").trim() || "solution";

export type BuildSolutionZipOptions = {
  /** Đường dẫn file trong zip (giữ slash để có cây thư mục). */
  paths: string[];
  fetchFile: (path: string) => Promise<Blob>;
  /** Thư mục gốc bên trong file .zip */
  rootFolderName: string;
  onProgress?: (loaded: number, total: number) => void;
};

/**
 * Tải từng blob theo path, gói vào một ZIP — examiner chỉ cần tải về một lần.
 */
export async function buildSolutionZipBlob(options: BuildSolutionZipOptions): Promise<Blob> {
  const { paths, fetchFile, rootFolderName, onProgress } = options;
  const zip = new JSZip();
  const root = zip.folder(sanitizeSegment(rootFolderName)) ?? zip;
  const total = paths.length;

  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    const blob = await fetchFile(p);
    const buf = await blob.arrayBuffer();
    root.file(p, buf);
    onProgress?.(i + 1, total);
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
