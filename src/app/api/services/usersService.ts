import { buildUsersUrl } from '../config/usersApiConfig';
import { requestJson, resolveApiUrl } from '../http/requestJson';
import type { AuthUser } from './authService';
import type { UserRole } from '../../types/enums';

export interface UserListItem {
  id: number;
  name: string;
  email: string;
  role: UserRole | string;
  isActive: boolean;
  createdAt: string;
}

export interface PagedResponse<T> {
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  data: T[];
}

export interface GetUsersParams {
  pageNumber: number;
  pageSize: number;
  token?: string;
}

/** API có thể trả isActive boolean hoặc 0/1. */
export function normalizeUserIsActive(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

const parseJsonLike = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  const raw = await response.text();

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error('Users API returned a non-JSON payload.');
  }
};

export const usersService = {
  getUsers: async ({ pageNumber, pageSize, token }: GetUsersParams): Promise<PagedResponse<UserListItem>> => {
    const url = new URL(buildUsersUrl('list'), window.location.origin);
    url.searchParams.set('PageNumber', String(pageNumber));
    url.searchParams.set('PageSize', String(pageSize));

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json, text/plain, */*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const raw = await parseJsonLike<PagedResponse<UserListItem>>(response);
    const data = (raw.data ?? []).map((u) => ({
      ...u,
      isActive: normalizeUserIsActive(u.isActive),
    }));
    return { ...raw, data };
  },

  /** PATCH /api/users/{id}/status — body `{ "isActive": true }`. */
  updateUserStatus: (userId: number, isActive: boolean) =>
    requestJson<AuthUser>({
      url: resolveApiUrl(`/api/users/${userId}/status`),
      method: 'PATCH',
      body: { isActive },
    }),
};
