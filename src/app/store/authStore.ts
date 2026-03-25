import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, AuthTokenResponse, AuthUser, UserRole } from '../api/services/authService';

type User = AuthUser;

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoadingProfile: boolean;
  register: (payload: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (payload: { name: string; email: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const toRecord = (value: unknown): Record<string, unknown> => {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
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

const normalizeRole = (value: unknown): UserRole | null => {
  const role = String(value);
  if (role === 'Admin' || role === 'Manager' || role === 'Examiner') {
    return role;
  }

  return null;
};

const getUserFromResponse = (payload: unknown): AuthUser | null => {
  const data = toRecord(payload);
  const rootAsUser = data;
  const nestedData = toRecord(data.data);
  const user = toRecord(data.user);
  const nestedUser = toRecord(nestedData.user);
  const source = Object.keys(user).length > 0
    ? user
    : Object.keys(nestedUser).length > 0
      ? nestedUser
      : rootAsUser;

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
      isLoadingProfile: false,
      isAuthenticated: false,
      register: async (payload) => {
        const data = (await authService.register(payload)) as AuthTokenResponse | unknown;
        const token = getTokenFromResponse(data);
        const refreshToken = getRefreshTokenFromResponse(data);
        const user = getUserFromResponse(data);

        if (!token) {
          return;
        }

        set({ token, refreshToken: refreshToken || null, user, isAuthenticated: true });

        if (!user) {
          await get().fetchProfile();
        }
      },
      login: async (email: string, password: string) => {
        const data = (await authService.login({ email, password })) as AuthTokenResponse | unknown;
        const token = getTokenFromResponse(data);
        const refreshToken = getRefreshTokenFromResponse(data);
        const user = getUserFromResponse(data);

        if (!token) {
          throw new Error('Dang nhap thanh cong nhung khong nhan duoc access token');
        }

        set({ token, refreshToken: refreshToken || null, user, isAuthenticated: true });

        if (!user) {
          await get().fetchProfile();
        }
      },
      fetchProfile: async () => {
        const token = get().token;

        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoadingProfile: true });

        try {
          const payload = await authService.getMe(token ?? undefined);
          const user = getUserFromResponse(payload);

          if (!user) {
            throw new Error('Khong doc duoc thong tin user tu /api/auth/me');
          }

          set({ user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
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
        const token = get().token;

        try {
          await authService.logout(token ?? undefined);
        } catch {
          // Clear client auth state even when the API logout request fails.
        }

        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoadingProfile: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
