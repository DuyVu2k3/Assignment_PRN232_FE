import { buildUsersUrl } from '../config/usersApiConfig';

export interface UserListItem {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Examiner' | string;
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
      credentials: 'omit',
      headers: {
        Accept: 'application/json, text/plain, */*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return parseJsonLike<PagedResponse<UserListItem>>(response);
  },
};
