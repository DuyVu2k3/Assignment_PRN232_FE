import { buildSubmissionsUrl } from '../config/submissionsApiConfig';
import { resolveApiUrl, getAccessToken, httpClearSession, httpNavigate, HttpRequestError } from '../http';

const parseMaybeJson = async (response: Response): Promise<Record<string, unknown> | null> => {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  let message = `Request failed with status ${response.status}`;

  const errorData = await parseMaybeJson(response);
  if (errorData) {
    if (typeof errorData.message === 'string') {
      message = errorData.message;
    } else if (typeof errorData.detail === 'string') {
      message = errorData.detail;
    } else if (typeof errorData.title === 'string') {
      message = errorData.title;
    } else if (errorData.errors && typeof errorData.errors === 'object') {
      const first = Object.values(errorData.errors as Record<string, unknown>)[0];
      if (Array.isArray(first) && typeof first[0] === 'string') {
        message = first[0];
      }
    }
  }

  return message;
};

export const submissionFilesService = {
  upload: async (
    archive: File,
    examId: number,
    notes?: string,
    gradingFile?: File,
  ): Promise<Record<string, unknown>> => {
    const fd = new FormData();
    fd.append('archive', archive);
    fd.append('examId', String(examId));
    if (notes !== undefined) fd.append('notes', String(notes));
    if (gradingFile) fd.append('gradingFile', gradingFile);

    const url = buildSubmissionsUrl('uploadFile');
    const token = getAccessToken();

    const targetUrl = resolveApiUrl(url);

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        credentials: 'omit',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });

      if (!response.ok) {
        const message = await parseErrorMessage(response);

        if (response.status === 401) {
          httpClearSession();
          httpNavigate('/unauthorized');
        } else if (response.status === 403) {
          httpNavigate('/forbidden');
        }

        throw new HttpRequestError(message, response.status);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as Record<string, unknown>;
      }

      const text = await response.text();
      return { result: text };
    } catch (err: any) {
      console.error('submissionFilesService.upload: fetch failed', { targetUrl, err });
      const msg = err?.message ?? 'Network request failed';
      throw new HttpRequestError(`Upload failed: ${msg}`, 0);
    }
  },
};
