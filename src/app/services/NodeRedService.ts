import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * NodeRedService - сервис для работы с Node-RED через прокси-контроллер бэкенда
 * Все запросы проходят через backend для авторизации и аудита
 */
class NodeRedService {
  /**
   * Отправить команду устройству
   */
  async sendDeviceCommand(deviceId: string, command: any): Promise<any> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.NODE_RED.CONTROL(deviceId),
        command
      );
      return response;
    } catch (error) {
      console.error('Failed to send device command:', error);
      throw error;
    }
  }

  /**
   * Получить состояние устройства
   */
  async getDeviceState(deviceId: string): Promise<any> {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.NODE_RED.STATE(deviceId)
      );
      return response;
    } catch (error) {
      console.error('Failed to get device state:', error);
      throw error;
    }
  }

  /**
   * Получить отчет по зданию
   */
  async getBuildingReport(
    buildingId: string,
    params?: {
      reportType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<any> {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.NODE_RED.REPORT_BUILDING(buildingId),
        { params }
      );
      return response;
    } catch (error) {
      console.error('Failed to get building report:', error);
      throw error;
    }
  }

  /**
   * Получить отчет по системе
   */
  async getSystemReport(
    systemType: string,
    params?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<any> {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.NODE_RED.REPORT_SYSTEM(systemType),
        { params }
      );
      return response;
    } catch (error) {
      console.error('Failed to get system report:', error);
      throw error;
    }
  }

  /**
   * Произвольный запрос к Node-RED (проксируется через backend)
   */
  async proxyRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: any
  ): Promise<any> {
    try {
      const url = `${API_ENDPOINTS.NODE_RED.PROXY}${path}`;
      
      switch (method) {
        case 'GET':
          return await apiClient.get(url);
        case 'POST':
          return await apiClient.post(url, data);
        case 'PUT':
          return await apiClient.put(url, data);
        case 'DELETE':
          return await apiClient.delete(url);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    } catch (error) {
      console.error('Failed to proxy request to Node-RED:', error);
      throw error;
    }
  }
}

export const nodeRedService = new NodeRedService();
