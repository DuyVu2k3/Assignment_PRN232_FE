export type HttpNavigateFn = (path: string) => void;

let navigateFn: HttpNavigateFn = (path) => {
  window.location.replace(path);
};

/** Gắn từ RootLayout (SPA). Trước khi mount, mặc định dùng `location.replace`. */
export function registerHttpNavigate(fn: HttpNavigateFn): void {
  navigateFn = fn;
}

export function httpNavigate(path: string): void {
  navigateFn(path);
}

let clearSessionFn: () => void = () => {};

/** Đăng ký trong main.tsx: xóa token không gọi API logout (tránh vòng 401). */
export function registerHttpClearSession(fn: () => void): void {
  clearSessionFn = fn;
}

export function httpClearSession(): void {
  clearSessionFn();
}
