import { requestJson } from './requestJson';

/** Gọi API đã gắn Bearer (trừ khi withAuth: false). */
export const api = {
  get: <T>(url: string) => requestJson<T>({ url, method: 'GET' }),
  post: <T>(url: string, body?: unknown) => requestJson<T>({ url, method: 'POST', body }),
  put: <T>(url: string, body?: unknown) => requestJson<T>({ url, method: 'PUT', body }),
  patch: <T>(url: string, body?: unknown) => requestJson<T>({ url, method: 'PATCH', body }),
  delete: <T>(url: string) => requestJson<T>({ url, method: 'DELETE' }),
};
