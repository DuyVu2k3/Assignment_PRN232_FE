/** Tránh RootLayout redirect /login khi vừa xử lý 401 (requestJson đã chuyển /unauthorized). */
const KEY = 'exam-fe-pending-http-401';

export function markPendingHttp401Redirect(): void {
  sessionStorage.setItem(KEY, '1');
}

export function consumePendingHttp401Redirect(): boolean {
  if (sessionStorage.getItem(KEY) !== '1') {
    return false;
  }
  sessionStorage.removeItem(KEY);
  return true;
}
