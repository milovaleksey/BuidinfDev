import { authService } from './AuthService';

export class ApiClient {
  private baseURL: string;

  constructor() {
    // Определяем базовый URL API
    this.baseURL = window.location.origin.replace(':5173', ':3000');
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = authService.getAccessToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: await this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    // Если токен истек (401), пытаемся обновить
    if (response.status === 401) {
      console.warn('API: Unauthorized, attempting to refresh token');
      const refreshed = await authService.refreshAccessToken();
      
      if (!refreshed) {
        // Редирект на страницу входа
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }

      // Повторяем запрос с новым токеном
      const retryResponse = await fetch(response.url, {
        method: response.headers.get('X-Request-Method') || 'GET',
        headers: await this.getHeaders(),
      });

      if (!retryResponse.ok) {
        throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
      }

      return retryResponse.json();
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Проверяем, есть ли тело ответа
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return {} as T;
  }
}

export const apiClient = new ApiClient();
