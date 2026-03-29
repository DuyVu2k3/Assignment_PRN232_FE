import { buildSubmissionSolutionsUrl } from '../config/submissionSolutionsApiConfig';
import { HttpRequestError, requestJson } from '../http/requestJson';
import { getAccessToken } from '../http/tokenProvider';

const normalizeFileList = (raw: unknown): string[] => {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string');
  }

  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.files)) {
      return o.files.filter((x): x is string => typeof x === 'string');
    }
    if (Array.isArray(o.data)) {
      return o.data.filter((x): x is string => typeof x === 'string');
    }
  }

  return [];
};

export const submissionSolutionsService = {
  listFiles: async (submissionEntryId: number): Promise<string[]> => {
    const url = buildSubmissionSolutionsUrl('files', submissionEntryId);
    const raw = await requestJson<unknown>({
      url,
      method: 'GET',
    });

    return normalizeFileList(raw);
  },

  /** Tải file (stream) kèm Bearer — dùng blob + tải xuống trình duyệt. */
  downloadFile: async (submissionEntryId: number, filePath: string): Promise<Blob> => {
    const basePath = buildSubmissionSolutionsUrl('download', submissionEntryId);
    const qs = new URLSearchParams({ filePath });
    const url = `${basePath}?${qs.toString()}`;

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
  },
};
