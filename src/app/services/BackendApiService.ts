import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '../config/api';
import { Building, Floor, Room, Device } from '../types';

/**
 * BackendApiService - сервис для работы с REST API бэкенда
 * Управляет структурой проекта (здания, этажи, помещения, устройства)
 * 
 * ВАЖНО: Бэкенд возвращает данные напрямую, без обёртки { success, data }
 */
class BackendApiService {
  // ==================== BUILDINGS ====================

  async getAllBuildings(): Promise<Building[]> {
    try {
      const buildings = await apiClient.get<Building[]>(
        API_ENDPOINTS.BUILDINGS.LIST
      );
      console.log('✅ Получено зданий из бэкенда:', buildings?.length || 0, buildings);
      return buildings || [];
    } catch (error) {
      console.error('❌ Failed to fetch buildings:', error);
      return [];
    }
  }

  async getBuilding(id: string): Promise<Building | null> {
    try {
      const building = await apiClient.get<Building>(
        API_ENDPOINTS.BUILDINGS.GET(id)
      );
      return building || null;
    } catch (error) {
      console.error('Failed to fetch building:', error);
      return null;
    }
  }

  async createBuilding(data: {
    name: string;
    address?: string;
  }): Promise<Building | null> {
    try {
      const building = await apiClient.post<Building>(
        API_ENDPOINTS.BUILDINGS.CREATE,
        data
      );
      return building || null;
    } catch (error) {
      console.error('Failed to create building:', error);
      throw error;
    }
  }

  async updateBuilding(
    id: string,
    data: Partial<Building>
  ): Promise<Building | null> {
    try {
      const building = await apiClient.put<Building>(
        API_ENDPOINTS.BUILDINGS.UPDATE(id),
        data
      );
      return building || null;
    } catch (error) {
      console.error('Failed to update building:', error);
      throw error;
    }
  }

  async deleteBuilding(id: string): Promise<boolean> {
    try {
      await apiClient.delete(API_ENDPOINTS.BUILDINGS.DELETE(id));
      return true;
    } catch (error) {
      console.error('Failed to delete building:', error);
      throw error;
    }
  }

  async exportBuilding(id: string): Promise<any> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.BUILDINGS.EXPORT(id));
      return response;
    } catch (error) {
      console.error('Failed to export building:', error);
      throw error;
    }
  }

  async importBuilding(buildingData: any): Promise<Building | null> {
    try {
      const building = await apiClient.post<Building>(
        API_ENDPOINTS.BUILDINGS.IMPORT,
        buildingData
      );
      return building || null;
    } catch (error) {
      console.error('Failed to import building:', error);
      throw error;
    }
  }

  // ==================== FLOORS ====================

  async getFloorsByBuilding(buildingId: string): Promise<Floor[]> {
    try {
      const floors = await apiClient.get<Floor[]>(
        API_ENDPOINTS.FLOORS.LIST(buildingId)
      );
      console.log(`✅ Получено этажей для здания ${buildingId}:`, floors?.length || 0);
      return floors || [];
    } catch (error) {
      console.error('Failed to fetch floors:', error);
      return [];
    }
  }

  async getFloor(id: string): Promise<Floor | null> {
    try {
      const floor = await apiClient.get<Floor>(
        API_ENDPOINTS.FLOORS.GET(id)
      );
      return floor || null;
    } catch (error) {
      console.error('Failed to fetch floor:', error);
      return null;
    }
  }

  async createFloor(
    buildingId: string,
    data: {
      name: string;
      number: number;
    }
  ): Promise<Floor | null> {
    try {
      const floor = await apiClient.post<Floor>(
        API_ENDPOINTS.FLOORS.CREATE(buildingId),
        data
      );
      return floor || null;
    } catch (error) {
      console.error('Failed to create floor:', error);
      throw error;
    }
  }

  async updateFloor(id: string, data: Partial<Floor>): Promise<Floor | null> {
    try {
      const floor = await apiClient.put<Floor>(
        API_ENDPOINTS.FLOORS.UPDATE(id),
        data
      );
      return floor || null;
    } catch (error) {
      console.error('Failed to update floor:', error);
      throw error;
    }
  }

  async deleteFloor(id: string): Promise<boolean> {
    try {
      await apiClient.delete(API_ENDPOINTS.FLOORS.DELETE(id));
      return true;
    } catch (error) {
      console.error('Failed to delete floor:', error);
      throw error;
    }
  }

  // ==================== ROOMS ====================

  async getRoomsByFloor(floorId: string): Promise<Room[]> {
    try {
      const rooms = await apiClient.get<Room[]>(
        API_ENDPOINTS.ROOMS.LIST(floorId)
      );
      console.log(`✅ Получено помещений для этажа ${floorId}:`, rooms?.length || 0);
      return rooms || [];
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      return [];
    }
  }

  async getRoom(id: string): Promise<Room | null> {
    try {
      const room = await apiClient.get<Room>(
        API_ENDPOINTS.ROOMS.GET(id)
      );
      return room || null;
    } catch (error) {
      console.error('Failed to fetch room:', error);
      return null;
    }
  }

  async createRoom(
    floorId: string,
    data: Partial<Room>
  ): Promise<Room | null> {
    try {
      const room = await apiClient.post<Room>(
        API_ENDPOINTS.ROOMS.CREATE(floorId),
        data
      );
      return room || null;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }

  async updateRoom(id: string, data: Partial<Room>): Promise<Room | null> {
    try {
      const room = await apiClient.put<Room>(
        API_ENDPOINTS.ROOMS.UPDATE(id),
        data
      );
      return room || null;
    } catch (error) {
      console.error('Failed to update room:', error);
      throw error;
    }
  }

  async deleteRoom(id: string): Promise<boolean> {
    try {
      await apiClient.delete(API_ENDPOINTS.ROOMS.DELETE(id));
      return true;
    } catch (error) {
      console.error('Failed to delete room:', error);
      throw error;
    }
  }

  // ==================== DEVICES ====================

  async getDevicesByRoom(roomId: string): Promise<Device[]> {
    try {
      const devices = await apiClient.get<Device[]>(
        API_ENDPOINTS.DEVICES.LIST(roomId)
      );
      console.log(`✅ Получено устройств для помещения ${roomId}:`, devices?.length || 0);
      return devices || [];
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      return [];
    }
  }

  async getDevice(id: string): Promise<Device | null> {
    try {
      const device = await apiClient.get<Device>(
        API_ENDPOINTS.DEVICES.GET(id)
      );
      return device || null;
    } catch (error) {
      console.error('Failed to fetch device:', error);
      return null;
    }
  }

  async createDevice(
    roomId: string,
    data: Partial<Device>
  ): Promise<Device | null> {
    try {
      const device = await apiClient.post<Device>(
        API_ENDPOINTS.DEVICES.CREATE(roomId),
        data
      );
      return device || null;
    } catch (error) {
      console.error('Failed to create device:', error);
      throw error;
    }
  }

  async updateDevice(
    id: string,
    data: Partial<Device>
  ): Promise<Device | null> {
    try {
      const device = await apiClient.put<Device>(
        API_ENDPOINTS.DEVICES.UPDATE(id),
        data
      );
      return device || null;
    } catch (error) {
      console.error('Failed to update device:', error);
      throw error;
    }
  }

  async updateDeviceState(id: string, state: any): Promise<Device | null> {
    try {
      const device = await apiClient.put<Device>(
        API_ENDPOINTS.DEVICES.UPDATE_STATE(id),
        state
      );
      return device || null;
    } catch (error) {
      console.error('Failed to update device state:', error);
      throw error;
    }
  }

  async deleteDevice(id: string): Promise<boolean> {
    try {
      await apiClient.delete(API_ENDPOINTS.DEVICES.DELETE(id));
      return true;
    } catch (error) {
      console.error('Failed to delete device:', error);
      throw error;
    }
  }
}

export const backendApiService = new BackendApiService();
