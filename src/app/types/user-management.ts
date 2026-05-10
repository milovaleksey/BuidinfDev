export interface BackendUser {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  roles: string[]; // ["ADMIN", "MANAGER", etc.]
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  roleIds: number[];
}

export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  password?: string;
  roleIds?: number[];
  enabled?: boolean;
}

export interface RoleData {
  id: number;
  name: string; // "ADMIN", "MANAGER", "OPERATOR", "VIEWER"
  description: string | null;
  createdAt: string;
}
