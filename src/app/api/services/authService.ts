import { buildAuthUrl, type AuthEndpointKey } from '../config/authApiConfig';
import { requestJson } from '../http/requestJson';

export type UserRole = 'Admin' | 'Manager' | 'Examiner' | 'Moderator';

export interface AuthUser {
  id: string | number;
  email: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/** Phản hồi chuẩn POST /api/auth/login (JWT Bearer, không cookie). */
export interface LoginTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  tokenType: string;
}

/** Đăng ký / các endpoint khác có thể trả thêm biến thể (tương thích cũ). */
export interface AuthTokenResponse extends Partial<LoginTokenResponse> {
  token?: string;
  jwtToken?: string;
  access_token?: string;
  jwt?: string;
  user?: AuthUser;
}

export interface RefreshTokenResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
}

const authUrl = (key: AuthEndpointKey) => buildAuthUrl(key);

export const authService = {
  register: (payload: RegisterRequest) =>
    requestJson<AuthTokenResponse>({
      url: authUrl('register'),
      method: 'POST',
      body: payload,
      withAuth: false,
    }),

  login: (payload: LoginRequest) =>
    requestJson<LoginTokenResponse>({
      url: authUrl('login'),
      method: 'POST',
      body: payload,
      withAuth: false,
    }),

  createUser: (payload: CreateUserRequest) =>
    requestJson<AuthUser>({
      url: authUrl('users'),
      method: 'POST',
      body: payload,
    }),

  getMe: () =>
    requestJson<AuthUser>({
      url: authUrl('me'),
      method: 'GET',
    }),

  refresh: () =>
    requestJson<RefreshTokenResponse>({
      url: authUrl('refresh'),
      method: 'POST',
      withAuth: false,
    }),

  logout: () =>
    requestJson<void>({
      url: authUrl('logout'),
      method: 'POST',
    }),
};
