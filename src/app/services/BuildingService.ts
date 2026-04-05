import { Building, Floor, Room, Device } from '../types';
import { buildingSystemService } from './BuildingSystemService';

/**
 * BuildingService - обертка для обратной совместимости
 * Теперь работает через BuildingSystemService с текущим зданием
 */
class BuildingService {
  isFromStorage(): boolean {
    return buildingSystemService.isFromStorage();
  }

  getLastUpdated(): string | undefined {
    return buildingSystemService.getLastUpdated();
  }

  getBuilding(): Building {
    const building = buildingSystemService.getCurrentBuilding();
    if (!building) {
      throw new Error('No current building selected');
    }
    return building;
  }

  getFloor(floorId: string): Floor | undefined {
    return buildingSystemService.getFloor(floorId);
  }

  getRoom(roomId: string): Room | undefined {
    return buildingSystemService.getRoom(roomId);
  }

  updateRoom(roomId: string, updates: Partial<Room>): void {
    buildingSystemService.updateRoom(roomId, updates);
  }

  updateDevice(deviceId: string, updates: Partial<Device>): void {
    buildingSystemService.updateDevice(deviceId, updates);
  }

  addDevice(roomId: string, device: Device): void {
    buildingSystemService.addDevice(roomId, device);
  }

  removeDevice(deviceId: string): void {
    buildingSystemService.removeDevice(deviceId);
  }

  // Storage methods
  saveToLocalStorage(): void {
    buildingSystemService.saveToLocalStorage();
  }

  exportToJSON(): void {
    const buildingId = buildingSystemService.getCurrentBuildingId();
    if (buildingId) {
      buildingSystemService.exportBuildingToJSON(buildingId);
    }
  }

  exportFloorToJSON(floorId: string): void {
    buildingSystemService.exportFloorToJSON(floorId);
  }

  async importFromJSON(file: File): Promise<void> {
    await buildingSystemService.importBuildingFromJSON(file);
  }

  async importFloorFromJSON(file: File): Promise<void> {
    await buildingSystemService.importFloorFromJSON(file);
  }

  getBuildingStats() {
    const buildingId = buildingSystemService.getCurrentBuildingId();
    if (buildingId) {
      return buildingSystemService.getBuildingStats(buildingId);
    }
    return null;
  }

  addFloor(name: string, number: number): Floor {
    const buildingId = buildingSystemService.getCurrentBuildingId();
    if (!buildingId) {
      throw new Error('No current building selected');
    }
    return buildingSystemService.addFloor(buildingId, name, number);
  }

  deleteFloor(floorId: string): void {
    buildingSystemService.deleteFloor(floorId);
  }

  exportBuilding() {
    return this.getBuilding();
  }

  importBuilding(buildingData: Building) {
    // This method is deprecated, use importFromJSON instead
    throw new Error('Use importFromJSON instead');
  }

  resetBuilding(): void {
    buildingSystemService.resetToDefault();
  }

  resetToDefault(): void {
    buildingSystemService.resetToDefault();
  }
}

export const buildingService = new BuildingService();