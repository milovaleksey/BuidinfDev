import { User, UserRole, SystemType } from '../types';
import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '../config/api';

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  roles: string[];
}

class AuthService {
  private currentUser: User | null = null;
  private readonly STORAGE_KEY = 'bms_current_user';
  private readonly USE_MOCK = false; // Установить в true для моковых данных

  constructor() {
    // Load user from localStorage
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
  }

  // Login with backend API
  async login(username: string, password: string): Promise<boolean> {
    if (this.USE_MOCK) {
      return this.mockLogin(username, password);
    }

    try {
      const response: LoginResponse = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        username,
        password,
      });

      // Save token
      apiClient.setToken(response.accessToken);

      // Map backend response to frontend User type
      const role = this.mapBackendRole(response.roles);
      this.currentUser = {
        id: response.userId.toString(),
        username: response.username,
        email: response.email,
        role: role,
        permissions: {
          rooms: [],
          systems: this.getSystemPermissionsByRole(role),
        },
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  private mapBackendRole(roles: string[]): UserRole {
    if (roles.includes('ROLE_ADMIN')) return 'admin';
    if (roles.includes('ROLE_MANAGER')) return 'manager';
    if (roles.includes('ROLE_OPERATOR')) return 'operator';
    return 'viewer';
  }

  private getSystemPermissionsByRole(role: UserRole): SystemType[] {
    switch (role) {
      case 'admin':
        return ['access_control', 'video', 'heating', 'lighting', 'hvac'];
      case 'manager':
        return ['access_control', 'heating', 'lighting', 'hvac'];
      case 'operator':
        return ['heating', 'lighting'];
      default:
        return [];
    }
  }

  // Mock login for testing without backend
  private mockLogin(username: string, password: string): boolean {
    // Моковые пользователи с паролями
    const mockUsers: Record<string, { user: User; password: string }> = {
      'admin': {
        password: 'admin123',
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@building.com',
          role: 'admin',
          permissions: {
            rooms: [], // admin has access to all rooms
            systems: ['access_control', 'video', 'heating', 'lighting', 'hvac']
          }
        }
      },
      'manager': {
        password: 'manager123',
        user: {
          id: '2',
          username: 'manager',
          email: 'manager@building.com',
          role: 'manager',
          permissions: {
            rooms: ['101', '102', '103', '104', '105', '201', '202'],
            systems: ['access_control', 'heating', 'lighting', 'hvac']
          }
        }
      },
      'operator': {
        password: 'operator123',
        user: {
          id: '3',
          username: 'operator',
          email: 'operator@building.com',
          role: 'operator',
          permissions: {
            rooms: ['101', '102', '103'],
            systems: ['heating', 'lighting']
          }
        }
      },
      'viewer': {
        password: 'viewer123',
        user: {
          id: '4',
          username: 'viewer',
          email: 'viewer@building.com',
          role: 'viewer',
          permissions: {
            rooms: ['101'],
            systems: []
          }
        }
      }
    };

    const userData = mockUsers[username];
    if (userData && password === userData.password) {
      this.currentUser = userData.user;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData.user));
      return true;
    }

    return false;
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(this.STORAGE_KEY);
    apiClient.clearToken();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  hasRoomAccess(roomId: string): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    return this.currentUser.permissions.rooms.includes(roomId);
  }

  hasSystemAccess(systemType: SystemType): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    return this.currentUser.permissions.systems.includes(systemType);
  }

  canManageUsers(): boolean {
    return this.currentUser?.role === 'admin';
  }

  canEditFloors(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'manager';
  }
}

export const authService = new AuthService();