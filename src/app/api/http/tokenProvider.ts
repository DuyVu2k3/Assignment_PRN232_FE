type TokenGetter = () => string | null;

let getToken: TokenGetter = () => null;

/** Gọi một lần lúc khởi động app (xem main.tsx). Tránh vòng import authStore ↔ http. */
export function setAuthTokenGetter(getter: TokenGetter): void {
  getToken = getter;
}

export function getAccessToken(): string | null {
  const t = getToken();
  return typeof t === 'string' && t.length > 0 ? t : null;
}
