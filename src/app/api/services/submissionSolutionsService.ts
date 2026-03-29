import {
  buildSubmissionSolutionsAttachmentDownloadUrl,
  buildSubmissionSolutionsUrl,
} from '../config/submissionSolutionsApiConfig';
import { HttpRequestError, requestJson } from '../http/requestJson';
import { getAccessToken } from '../http/tokenProvider';

/** Một dòng trong solution.zip từ GET .../files */
export interface SolutionFileEntry {
  path: string;
  size: number;
  isDirectory: boolean;
}

export interface SolutionAttachment {
  assetId: number;
  fileName: string;
  relativePath: string;
  size: number;
}

export interface SubmissionSolutionFilesResponse {
  submissionEntryId: number;
  solutionFiles: SolutionFileEntry[];
  attachments: SolutionAttachment[];
}

const parseSolutionFileEntry = (raw: unknown): SolutionFileEntry | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const path = typeof o.path === 'string' ? o.path : '';
  if (!path) return null;
  const size = typeof o.size === 'number' ? o.size : Number(o.size) || 0;
  const isDirectory = Boolean(o.isDirectory);
  return { path, size, isDirectory };
};

const parseAttachment = (raw: unknown): SolutionAttachment | null => {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const assetId = typeof o.assetId === 'number' ? o.assetId : Number(o.assetId);
  if (!Number.isFinite(assetId)) return null;
  return {
    assetId,
    fileName: typeof o.fileName === 'string' ? o.fileName : '',
    relativePath: typeof o.relativePath === 'string' ? o.relativePath : '',
    size: typeof o.size === 'number' ? o.size : Number(o.size) || 0,
  };
};

export const parseSubmissionSolutionFilesResponse = (raw: unknown): SubmissionSolutionFilesResponse => {
  const empty = (): SubmissionSolutionFilesResponse => ({
    submissionEntryId: 0,
    solutionFiles: [],
    attachments: [],
  });

  if (raw == null) {
    return empty();
  }

  /** Legacy: mảng chuỗi path */
  if (Array.isArray(raw)) {
    const strings = raw.filter((x): x is string => typeof x === 'string');
    if (strings.length > 0) {
      return {
        submissionEntryId: 0,
        solutionFiles: strings.map((path) => ({ path, size: 0, isDirectory: false })),
        attachments: [],
      };
    }
    return empty();
  }

  if (typeof raw !== 'object') {
    return empty();
  }

  const o = raw as Record<string, unknown>;
  const submissionEntryId =
    typeof o.submissionEntryId === 'number'
      ? o.submissionEntryId
      : Number(o.submissionEntryId) || 0;

  const solutionFiles: SolutionFileEntry[] = [];
  if (Array.isArray(o.solutionFiles)) {
    for (const item of o.solutionFiles) {
      const row = parseSolutionFileEntry(item);
      if (row) solutionFiles.push(row);
    }
  }

  const attachments: SolutionAttachment[] = [];
  if (Array.isArray(o.attachments)) {
    for (const item of o.attachments) {
      const row = parseAttachment(item);
      if (row) attachments.push(row);
    }
  }

  return { submissionEntryId, solutionFiles, attachments };
};

const fetchBlobAuthorized = async (url: string): Promise<Blob> => {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const err = (await response.json()) as Record<string, unknown>;
      if (typeof err.message === 'string') {
        message = err.message;
      } else if (typeof err.detail === 'string') {
        message = err.detail;
      }
    } catch {
      // ignore
    }
    throw new HttpRequestError(message, response.status);
  }

  return response.blob();
};

export const submissionSolutionsService = {
  /**
   * GET /submission-solutions/{submissionEntryId}/files
   * Trả về cấu trúc solutionFiles + attachments.
   */
  getSolutionFiles: async (submissionEntryId: number): Promise<SubmissionSolutionFilesResponse> => {
    const url = buildSubmissionSolutionsUrl('files', submissionEntryId);
    const raw = await requestJson<unknown>({
      url,
      method: 'GET',
    });

    return parseSubmissionSolutionFilesResponse(raw);
  },

  /**
   * GET .../download?filePath= — giá trị path khớp một dòng solutionFiles (file, không phải folder).
   * Dùng encodeURIComponent để path an toàn trên query.
   */
  downloadFile: async (submissionEntryId: number, filePath: string): Promise<Blob> => {
    const basePath = buildSubmissionSolutionsUrl('download', submissionEntryId);
    const url = `${basePath}?filePath=${encodeURIComponent(filePath)}`;
    return fetchBlobAuthorized(url);
  },

  /**
   * GET /submission-solutions/{submissionEntryId}/attachments/{assetId}/download
   */
  downloadAttachment: async (submissionEntryId: number, assetId: number): Promise<Blob> => {
    const url = buildSubmissionSolutionsAttachmentDownloadUrl(submissionEntryId, assetId);
    return fetchBlobAuthorized(url);
  },
};
