import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '../config/api';
import { BackendUser, CreateUserRequest, UpdateUserRequest, RoleData } from '../types/user-management';

class UserManagementService {
  
  async getAllUsers(): Promise<BackendUser[]> {
    return apiClient.get(API_ENDPOINTS.USERS.LIST);
  }

  async getUserById(id: number): Promise<BackendUser> {
    return apiClient.get(API_ENDPOINTS.USERS.GET(id.toString()));
  }

  async createUser(request: CreateUserRequest): Promise<BackendUser> {
    return apiClient.post(API_ENDPOINTS.USERS.CREATE, request);
  }

  async updateUser(id: number, request: UpdateUserRequest): Promise<BackendUser> {
    return apiClient.put(API_ENDPOINTS.USERS.UPDATE(id.toString()), request);
  }

  async deleteUser(id: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.USERS.DELETE(id.toString()));
  }

  async toggleUserStatus(id: number): Promise<BackendUser> {
    return apiClient.patch(API_ENDPOINTS.USERS.TOGGLE_STATUS(id.toString()), {});
  }

  async getAllRoles(): Promise<RoleData[]> {
    return apiClient.get(API_ENDPOINTS.ROLES.LIST);
  }
}

export const userManagementService = new UserManagementService();
