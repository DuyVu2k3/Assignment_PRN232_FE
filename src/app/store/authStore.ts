import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HttpRequestError } from '../api/http/requestJson';
import { authService, AuthTokenResponse, AuthUser } from '../api/services/authService';
import { UserRole } from '../types/enums';

type User = AuthUser;

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  tokenType: string | null;
  isLoadingProfile: boolean;
  register: (payload: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (payload: { name: string; email: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Xóa session phía client, không gọi API (dùng khi 401 để tránh vòng lặp). */
  clearLocalSession: () => void;
  isAuthenticated: boolean;
}

const toRecord = (value: unknown): Record<string, unknown> => {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
};

const getSessionMetaFromResponse = (payload: unknown) => {
  const data = toRecord(payload);
  return {
    accessTokenExpiresAt: typeof data.accessTokenExpiresAt === 'string' ? data.accessTokenExpiresAt : null,
    refreshTokenExpiresAt: typeof data.refreshTokenExpiresAt === 'string' ? data.refreshTokenExpiresAt : null,
    tokenType: typeof data.tokenType === 'string' ? data.tokenType : null,
  };
};

const getTokenFromResponse = (payload: unknown): string => {
  if (typeof payload === 'string') {
    return payload;
  }

  const data = toRecord(payload);
  const nestedData = toRecord(data.data);
  const candidates = [
    data.token,
    data.accessToken,
    data.jwtToken,
    data.access_token,
    data.jwt,
    nestedData.token,
    nestedData.accessToken,
    nestedData.jwtToken,
    nestedData.access_token,
    nestedData.jwt,
  ];

  const found = candidates.find((item) => typeof item === 'string' && item.length > 0);
  return (found as string) ?? '';
};

const getRefreshTokenFromResponse = (payload: unknown): string => {
  if (typeof payload === 'string') {
    return '';
  }

  const data = toRecord(payload);
  const nestedData = toRecord(data.data);
  const candidates = [data.refreshToken, data.refresh_token, nestedData.refreshToken, nestedData.refresh_token];
  const found = candidates.find((item) => typeof item === 'string' && item.length > 0);
  return (found as string) ?? '';
};

const ROLE_SET = new Set<string>(Object.values(UserRole));

const normalizeRole = (value: unknown): UserRole | null => {
  const role = String(value);
  return ROLE_SET.has(role) ? (role as UserRole) : null;
};

const getUserFromResponse = (payload: unknown): AuthUser | null => {
  const data = toRecord(payload);
  const nestedData = toRecord(data.data);
  const user = toRecord(data.user);
  const nestedUser = toRecord(nestedData.user);
  const nestedDataIsUser =
    nestedData.id !== undefined &&
    nestedData.id !== null &&
    typeof nestedData.email === 'string' &&
    typeof nestedData.name === 'string' &&
    nestedData.role !== undefined &&
    nestedData.role !== null;

  const source = Object.keys(user).length > 0
    ? user
    : Object.keys(nestedUser).length > 0
      ? nestedUser
      : nestedDataIsUser
        ? nestedData
        : data;

  if (source.id === undefined || source.id === null || !source.email || !source.name || !source.role) {
    return null;
  }

  const role = normalizeRole(source.role);
  if (!role) {
    return null;
  }

  return {
    id: source.id as string | number,
    email: String(source.email),
    name: String(source.name),
    role,
    isActive: typeof source.isActive === 'boolean' ? source.isActive : undefined,
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : undefined,
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      tokenType: null,
      isLoadingProfile: false,
      isAuthenticated: false,
      register: async (payload) => {
        const data = (await authService.register(payload)) as AuthTokenResponse | unknown;
        const token = getTokenFromResponse(data);
        const refreshToken = getRefreshTokenFromResponse(data);
        const user = getUserFromResponse(data);
        const sessionMeta = getSessionMetaFromResponse(data);

        if (!token) {
          throw new Error('Đăng ký thành công nhưng phản hồi không có access token');
        }

        set({
          token,
          refreshToken: refreshToken || null,
          user,
          isAuthenticated: true,
          ...sessionMeta,
        });

        if (!user) {
          await get().fetchProfile();
        }
      },
      login: async (email: string, password: string) => {
        const data = await authService.login({ email, password });
        const token = getTokenFromResponse(data);
        const refreshToken = getRefreshTokenFromResponse(data);
        const user = getUserFromResponse(data);
        const sessionMeta = getSessionMetaFromResponse(data);

        if (!token) {
          throw new Error('Đăng nhập thành công nhưng phản hồi không có access token');
        }

        set({
          token,
          refreshToken: refreshToken || null,
          user,
          isAuthenticated: true,
          ...sessionMeta,
        });

        if (!user) {
          await get().fetchProfile();
        }
      },
      fetchProfile: async () => {
        const token = get().token;

        if (!token) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            tokenType: null,
            isAuthenticated: false,
          });
          return;
        }

        set({ isLoadingProfile: true });

        try {
          const payload = await authService.getMe();
          const user = getUserFromResponse(payload);

          if (!user) {
            throw new Error('Không đọc được thông tin user từ /api/auth/me');
          }

          set({ user, isAuthenticated: true });
        } catch (error) {
          if (error instanceof HttpRequestError && error.status === 403) {
            throw error;
          }
          get().clearLocalSession();
          throw error;
        } finally {
          set({ isLoadingProfile: false });
        }
      },
      updateProfile: async (payload) => {
        const currentUser = get().user;

        if (!currentUser) {
          throw new Error('Ban chua dang nhap');
        }

        set({
          user: {
            ...currentUser,
            name: payload.name,
            email: payload.email,
          },
        });
      },
      changePassword: async (currentPassword, newPassword) => {
        if (!currentPassword || !newPassword) {
          throw new Error('Vui long nhap day du mat khau');
        }

        if (newPassword.length < 6) {
          throw new Error('Mat khau moi phai co it nhat 6 ky tu');
        }
      },
      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Clear client auth state even when the API logout request fails.
        }

        get().clearLocalSession();
      },
      clearLocalSession: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          tokenType: null,
          isAuthenticated: false,
          isLoadingProfile: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
        refreshTokenExpiresAt: state.refreshTokenExpiresAt,
        tokenType: state.tokenType,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
