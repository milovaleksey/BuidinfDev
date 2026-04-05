import { User, UserRole, SystemType } from '../types';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // в секундах
}

class AuthService {
  private currentUser: User | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiryTime: number | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;

  private readonly STORAGE_KEY = 'bms_current_user';
  private readonly ACCESS_TOKEN_KEY = 'bms_access_token';
  private readonly REFRESH_TOKEN_KEY = 'bms_refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'bms_token_expiry';

  // URL бэкенда - из логов видно что это внутренний адрес
  private readonly API_BASE_URL = window.location.origin.replace(':5173', ':3000');

  constructor() {
    // Load user and tokens from localStorage
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }

    this.accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    this.refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (expiry) {
      this.tokenExpiryTime = parseInt(expiry, 10);
    }

    // Проверяем и обновляем токен при инициализации
    if (this.isAuthenticated() && this.refreshToken) {
      this.scheduleTokenRefresh();
    }
  }

  // Реальный login с API
  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        console.error('Login failed:', response.status);
        return false;
      }

      const data = await response.json();
      
      // Ожидаем структуру: { user, accessToken, refreshToken, expiresIn }
      if (data.user && data.accessToken) {
        this.setAuthData(data.user, {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn || 3600, // по умолчанию 1 час
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback на моковый login для разработки
      return this.mockLogin(username, password);
    }
  }

  // Моковый login для разработки (когда бэкенд недоступен)
  private mockLogin(username: string, password: string): boolean {
    const mockUsers: Record<string, { user: User; password: string }> = {
      'admin': {
        password: 'admin123',
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@building.com',
          role: 'admin',
          permissions: {
            rooms: [],
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
      // Генерируем моковый JWT токен
      const mockToken = this.generateMockJWT(userData.user);
      this.setAuthData(userData.user, {
        accessToken: mockToken,
        refreshToken: mockToken,
        expiresIn: 3600,
      });
      return true;
    }

    return false;
  }

  // Генерация мокового JWT токена
  private generateMockJWT(user: User): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 час
    }));
    const signature = btoa('mock-signature');
    return `${header}.${payload}.${signature}`;
  }

  // Установка данных авторизаци��
  private setAuthData(user: User, tokens: AuthTokens): void {
    this.currentUser = user;
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.tokenExpiryTime = Date.now() + tokens.expiresIn * 1000;

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, this.tokenExpiryTime.toString());

    this.scheduleTokenRefresh();
  }

  // Планирование обновления токена
  private scheduleTokenRefresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    if (!this.tokenExpiryTime || !this.refreshToken) {
      return;
    }

    // Обновляем токен за 5 минут до истечения
    const timeUntilRefresh = this.tokenExpiryTime - Date.now() - 5 * 60 * 1000;
    
    if (timeUntilRefresh > 0) {
      this.refreshTimeout = setTimeout(() => {
        this.refreshAccessToken();
      }, timeUntilRefresh);
    } else {
      // Токен уже истек или истекает, обновляем немедленно
      this.refreshAccessToken();
    }
  }

  // Обновление access токена
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      console.error('No refresh token available');
      this.logout();
      return false;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        console.error('Token refresh failed:', response.status);
        this.logout();
        return false;
      }

      const data = await response.json();
      
      if (data.accessToken && this.currentUser) {
        this.setAuthData(this.currentUser, {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || this.refreshToken,
          expiresIn: data.expiresIn || 3600,
        });
        console.log('✅ Token refreshed successfully');
        return true;
      }

      this.logout();
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      // При ошибке не выходим сразу, даем возможность повторить
      // Планируем повторную попытку через 1 минуту
      setTimeout(() => this.refreshAccessToken(), 60000);
      return false;
    }
  }

  // Получение текущего access токена
  getAccessToken(): string | null {
    // Проверяем, не истек ли токен
    if (this.tokenExpiryTime && Date.now() >= this.tokenExpiryTime) {
      console.warn('Access token expired, triggering refresh');
      this.refreshAccessToken();
    }
    return this.accessToken;
  }

  logout(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiryTime = null;
    
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.accessToken !== null;
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