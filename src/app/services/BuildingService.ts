import { Building, Floor, Room, Device } from '../types';
import { integratedBuildingService } from './IntegratedBuildingService';

/**
 * BuildingService - обертка для обратной совместимости
 * Теперь работает через IntegratedBuildingService с текущим зданием
 */
class BuildingService {
  isFromStorage(): boolean {
    return integratedBuildingService.isFromStorage();
  }

  isFromBackend(): boolean {
    return integratedBuildingService.isFromBackend();
  }

  getLastUpdated(): string | undefined {
    return integratedBuildingService.getLastUpdated();
  }

  getBuilding(): Building {
    const building = integratedBuildingService.getCurrentBuilding();
    if (!building) {
      throw new Error('No current building selected');
    }
    return building;
  }

  getFloor(floorId: string): Floor | undefined {
    return integratedBuildingService.getFloor(floorId);
  }

  getRoom(roomId: string): Room | undefined {
    return integratedBuildingService.getRoom(roomId);
  }

  updateRoom(roomId: string, updates: Partial<Room>): void {
    integratedBuildingService.updateRoom(roomId, updates);
  }

  updateDevice(deviceId: string, updates: Partial<Device>): void {
    integratedBuildingService.updateDevice(deviceId, updates);
  }

  addDevice(roomId: string, device: Device): void {
    integratedBuildingService.addDevice(roomId, device);
  }

  removeDevice(deviceId: string): void {
    integratedBuildingService.removeDevice(deviceId);
  }

  // Storage methods
  saveToLocalStorage(): void {
    integratedBuildingService.saveToLocalStorage();
  }

  exportToJSON(): void {
    const buildingId = integratedBuildingService.getCurrentBuildingId();
    if (buildingId) {
      integratedBuildingService.exportBuildingToJSON(buildingId);
    }
  }

  exportFloorToJSON(floorId: string): void {
    // TODO: Implement floor export in IntegratedBuildingService
    console.warn('exportFloorToJSON not yet implemented');
  }

  async importFromJSON(file: File): Promise<void> {
    await integratedBuildingService.importBuildingFromJSON(file);
  }

  async importFloorFromJSON(file: File): Promise<void> {
    // TODO: Implement floor import in IntegratedBuildingService
    console.warn('importFloorFromJSON not yet implemented');
  }

  getBuildingStats() {
    const buildingId = integratedBuildingService.getCurrentBuildingId();
    if (buildingId) {
      return integratedBuildingService.getBuildingStats(buildingId);
    }
    return null;
  }

  async addFloor(name: string, number: number): Promise<Floor> {
    const buildingId = integratedBuildingService.getCurrentBuildingId();
    if (!buildingId) {
      throw new Error('No current building selected');
    }
    return await integratedBuildingService.addFloor(buildingId, name, number);
  }

  async deleteFloor(floorId: string): Promise<void> {
    await integratedBuildingService.deleteFloor(floorId);
  }

  exportBuilding() {
    return this.getBuilding();
  }

  importBuilding(buildingData: Building) {
    // This method is deprecated, use importFromJSON instead
    throw new Error('Use importFromJSON instead');
  }

  resetBuilding(): void {
    integratedBuildingService.resetToDefault();
  }

  resetToDefault(): void {
    integratedBuildingService.resetToDefault();
  }
}

export const buildingService = new BuildingService();