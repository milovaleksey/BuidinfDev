import { Building, Floor, Room, Device, BuildingSystem } from '../types';
import { storageService } from './StorageService';

class BuildingSystemService {
  private buildingSystem: BuildingSystem;
  private isLoadedFromStorage: boolean = false;

  constructor() {
    // Try to load from localStorage first
    const savedSystem = storageService.loadSystemFromLocalStorage();
    if (savedSystem) {
      this.buildingSystem = savedSystem;
      this.isLoadedFromStorage = true;
      console.log('✅ Система зданий загружена из localStorage');
    } else {
      this.buildingSystem = this.generateDefaultSystem();
      this.isLoadedFromStorage = false;
      console.log('📦 Создана новая система зданий');
    }
  }

  isFromStorage(): boolean {
    return this.isLoadedFromStorage;
  }

  getLastUpdated(): string | undefined {
    return this.buildingSystem.updatedAt;
  }

  private generateDefaultSystem(): BuildingSystem {
    const building = this.generateMockBuilding('building_1', 'Главное здание');
    
    return {
      buildings: [building],
      currentBuildingId: building.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private generateMockBuilding(id: string, name: string, address?: string): Building {
    const floors: Floor[] = [];

    for (let floorNum = 1; floorNum <= 5; floorNum++) {
      const rooms: Room[] = [];
      const roomsPerFloor = 5;

      for (let roomIdx = 0; roomIdx < roomsPerFloor; roomIdx++) {
        const roomNumber = `${floorNum}0${roomIdx + 1}`;
        const room: Room = {
          id: roomNumber,
          number: roomNumber,
          name: this.getRoomName(floorNum, roomIdx),
          floorId: `${id}_floor_${floorNum}`,
          area: 25 + Math.random() * 50,
          position: { 
            x: 50 + (roomIdx * 180), 
            y: 100 + (Math.random() * 100)
          },
          dimensions: { 
            width: 150 + Math.random() * 50, 
            height: 120 + Math.random() * 40 
          },
          devices: this.generateDevicesForRoom(roomNumber, id, floorNum),
          mqttTopic: `${id}/floor${floorNum}/room${roomNumber}`
        };
        rooms.push(room);
      }

      floors.push({
        id: `${id}_floor_${floorNum}`,
        number: floorNum,
        name: `Этаж ${floorNum}`,
        buildingId: id,
        rooms
      });
    }

    return {
      id,
      name,
      address,
      floors,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private getRoomName(floor: number, roomIdx: number): string {
    const names = [
      ['Приемная', 'Конференц-зал', 'Офис менеджера', 'Архив', 'Серверная'],
      ['Кабинет 201', 'Кабинет 202', 'Кабинет 203', 'Переговорная', 'Кухня'],
      ['Отдел разработки', 'Лаборатория', 'Тестовая', 'Хранилище', 'Комната отдыха'],
      ['Кабинет директора', 'Бухгалтерия', 'Юридический отдел', 'HR', 'Переговорная VIP'],
      ['Зал заседаний', 'Учебный класс', 'Библиотека', 'Кабинет 501', 'Терраса']
    ];
    return names[floor - 1]?.[roomIdx] || `Помещение ${floor}0${roomIdx + 1}`;
  }

  private generateDevicesForRoom(roomId: string, buildingId: string, floorNum: number): Device[] {
    const devices: Device[] = [];
    const roomTopic = `${buildingId}/floor${floorNum}/room${roomId}`;

    // Temperature sensor
    devices.push({
      id: `temp_${roomId}`,
      name: 'Датчик температуры',
      type: 'temperature_sensor',
      status: 'online',
      roomId,
      position: { x: 20, y: 20 },
      data: {
        temperature: 22 + Math.random() * 3,
        humidity: 40 + Math.random() * 20
      },
      systemType: 'sensors',
      mqttTopic: `${roomTopic}/temperature_sensor/temp_${roomId}`
    });

    // CO2 sensor
    devices.push({
      id: `co2_${roomId}`,
      name: 'Датчик CO2',
      type: 'co2_sensor',
      status: 'online',
      roomId,
      position: { x: 40, y: 20 },
      data: {
        co2: 400 + Math.random() * 400
      },
      systemType: 'sensors',
      mqttTopic: `${roomTopic}/co2_sensor/co2_${roomId}`
    });

    // Radiator (батарея)
    if (Math.random() > 0.2) {
      devices.push({
        id: `rad_${roomId}`,
        name: 'Батарея отопления',
        type: 'radiator',
        status: 'online',
        roomId,
        position: { x: 10, y: 60 },
        data: {
          temperature: 55 + Math.random() * 10
        },
        systemType: 'heating',
        mqttTopic: `${roomTopic}/radiator/rad_${roomId}`
      });
    }

    // Door (СКУД)
    devices.push({
      id: `door_${roomId}`,
      name: 'Дверь',
      type: 'door',
      status: 'online',
      roomId,
      position: { x: 5, y: 50 },
      data: {
        isOpen: Math.random() > 0.5,
        isOnControl: true,
        isClosed: Math.random() < 0.5,
        mode: 'control'
      },
      systemType: 'access_control',
      mqttTopic: `${roomTopic}/door/door_${roomId}`
    });

    // Light fixtures (светильники)
    const numLights = Math.floor(1 + Math.random() * 3);
    for (let i = 0; i < numLights; i++) {
      devices.push({
        id: `light_${roomId}_${i}`,
        name: `Светильник ${i + 1}`,
        type: 'light_fixture',
        status: Math.random() > 0.95 ? 'offline' : 'online',
        roomId,
        position: { 
          x: 30 + (i * 40), 
          y: 10 
        },
        data: {
          lightLevel: Math.random() * 100
        },
        systemType: 'lighting',
        mqttTopic: `${roomTopic}/light_fixture/light_${roomId}_${i}`
      });
    }

    // Camera
    if (Math.random() > 0.3) {
      devices.push({
        id: `cam_${roomId}`,
        name: 'Камера видеонаблюдения',
        type: 'camera',
        status: Math.random() > 0.9 ? 'offline' : 'online',
        roomId,
        position: { x: 120, y: 10 },
        data: {
          recording: true
        },
        systemType: 'video',
        mqttTopic: `${roomTopic}/camera/cam_${roomId}`
      });
    }

    // Wall AC (кондиционер)
    if (Math.random() > 0.4) {
      devices.push({
        id: `ac_${roomId}`,
        name: 'Настенный кондиционер',
        type: 'wall_ac',
        status: 'online',
        roomId,
        position: { x: 130, y: 5 },
        data: {
          temperature: 22,
          isPowerOn: Math.random() > 0.5,
          fanMode: 'auto',
          workMode: 'cool',
          targetTemperature: 22
        },
        systemType: 'hvac',
        mqttTopic: `${roomTopic}/wall_ac/ac_${roomId}`
      });
    }

    return devices;
  }

  // Building management
  getAllBuildings(): Building[] {
    return this.buildingSystem.buildings;
  }

  getCurrentBuilding(): Building | undefined {
    if (!this.buildingSystem.currentBuildingId) {
      return this.buildingSystem.buildings[0];
    }
    return this.buildingSystem.buildings.find(b => b.id === this.buildingSystem.currentBuildingId);
  }

  getCurrentBuildingId(): string | undefined {
    return this.buildingSystem.currentBuildingId || this.buildingSystem.buildings[0]?.id;
  }

  setCurrentBuilding(buildingId: string): void {
    const building = this.buildingSystem.buildings.find(b => b.id === buildingId);
    if (building) {
      this.buildingSystem.currentBuildingId = buildingId;
      this.saveToLocalStorage();
    }
  }

  getBuilding(buildingId: string): Building | undefined {
    return this.buildingSystem.buildings.find(b => b.id === buildingId);
  }

  createBuilding(name: string, address?: string): Building {
    const newBuilding: Building = {
      id: `building_${Date.now()}`,
      name,
      address,
      floors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.buildingSystem.buildings.push(newBuilding);
    this.buildingSystem.currentBuildingId = newBuilding.id;
    this.saveToLocalStorage();
    
    return newBuilding;
  }

  deleteBuilding(buildingId: string): void {
    const buildingIndex = this.buildingSystem.buildings.findIndex(b => b.id === buildingId);
    if (buildingIndex !== -1) {
      this.buildingSystem.buildings.splice(buildingIndex, 1);
      
      // If deleted current building, switch to first available
      if (this.buildingSystem.currentBuildingId === buildingId) {
        this.buildingSystem.currentBuildingId = this.buildingSystem.buildings[0]?.id;
      }
      
      this.saveToLocalStorage();
    }
  }

  updateBuilding(buildingId: string, updates: Partial<Building>): void {
    const building = this.getBuilding(buildingId);
    if (building) {
      Object.assign(building, updates);
      building.updatedAt = new Date().toISOString();
      this.saveToLocalStorage();
    }
  }

  // Floor management
  getFloor(floorId: string): Floor | undefined {
    for (const building of this.buildingSystem.buildings) {
      const floor = building.floors.find(f => f.id === floorId);
      if (floor) return floor;
    }
    return undefined;
  }

  addFloor(buildingId: string, name: string, number: number): Floor {
    const building = this.getBuilding(buildingId);
    if (!building) {
      throw new Error('Building not found');
    }

    const newFloor: Floor = {
      id: `${buildingId}_floor_${Date.now()}`,
      number,
      name,
      buildingId,
      rooms: [],
    };
    
    building.floors.push(newFloor);
    building.floors.sort((a, b) => a.number - b.number);
    building.updatedAt = new Date().toISOString();
    this.saveToLocalStorage();
    
    return newFloor;
  }

  deleteFloor(floorId: string): void {
    for (const building of this.buildingSystem.buildings) {
      const floorIndex = building.floors.findIndex(f => f.id === floorId);
      if (floorIndex !== -1) {
        building.floors.splice(floorIndex, 1);
        building.updatedAt = new Date().toISOString();
        this.saveToLocalStorage();
        return;
      }
    }
  }

  // Room management
  getRoom(roomId: string): Room | undefined {
    for (const building of this.buildingSystem.buildings) {
      for (const floor of building.floors) {
        const room = floor.rooms.find(r => r.id === roomId);
        if (room) return room;
      }
    }
    return undefined;
  }

  updateRoom(roomId: string, updates: Partial<Room>): void {
    for (const building of this.buildingSystem.buildings) {
      for (const floor of building.floors) {
        const roomIndex = floor.rooms.findIndex(r => r.id === roomId);
        if (roomIndex !== -1) {
          floor.rooms[roomIndex] = { ...floor.rooms[roomIndex], ...updates };
          building.updatedAt = new Date().toISOString();
          this.saveToLocalStorage();
          return;
        }
      }
    }
  }

  // Device management
  updateDevice(deviceId: string, updates: Partial<Device>): void {
    for (const building of this.buildingSystem.buildings) {
      for (const floor of building.floors) {
        for (const room of floor.rooms) {
          const deviceIndex = room.devices.findIndex(d => d.id === deviceId);
          if (deviceIndex !== -1) {
            room.devices[deviceIndex] = { ...room.devices[deviceIndex], ...updates };
            building.updatedAt = new Date().toISOString();
            this.saveToLocalStorage();
            return;
          }
        }
      }
    }
  }

  addDevice(roomId: string, device: Device): void {
    for (const building of this.buildingSystem.buildings) {
      for (const floor of building.floors) {
        const room = floor.rooms.find(r => r.id === roomId);
        if (room) {
          room.devices = [...room.devices, device];
          building.updatedAt = new Date().toISOString();
          this.saveToLocalStorage();
          return;
        }
      }
    }
  }

  removeDevice(deviceId: string): void {
    for (const building of this.buildingSystem.buildings) {
      for (const floor of building.floors) {
        for (const room of floor.rooms) {
          const deviceIndex = room.devices.findIndex(d => d.id === deviceId);
          if (deviceIndex !== -1) {
            room.devices.splice(deviceIndex, 1);
            building.updatedAt = new Date().toISOString();
            this.saveToLocalStorage();
            return;
          }
        }
      }
    }
  }

  // Storage methods
  saveToLocalStorage(): void {
    this.buildingSystem.updatedAt = new Date().toISOString();
    storageService.saveSystemToLocalStorage(this.buildingSystem);
  }

  exportSystemToJSON(): void {
    storageService.exportSystemToJSON(this.buildingSystem);
  }

  exportBuildingToJSON(buildingId: string): void {
    const building = this.getBuilding(buildingId);
    if (building) {
      storageService.exportToJSON(building);
    }
  }

  exportFloorToJSON(floorId: string): void {
    const floor = this.getFloor(floorId);
    if (floor) {
      storageService.exportFloorToJSON(floor);
    }
  }

  async importBuildingFromJSON(file: File): Promise<void> {
    const importedBuilding = await storageService.importFromJSON(file);
    
    // Replace building if exists, otherwise add
    const existingIndex = this.buildingSystem.buildings.findIndex(b => b.id === importedBuilding.id);
    if (existingIndex !== -1) {
      this.buildingSystem.buildings[existingIndex] = importedBuilding;
    } else {
      this.buildingSystem.buildings.push(importedBuilding);
    }
    
    this.saveToLocalStorage();
  }

  async importFloorFromJSON(file: File): Promise<void> {
    const importedFloor = await storageService.importFloorFromJSON(file);
    
    // Find the building and replace/add floor
    for (const building of this.buildingSystem.buildings) {
      if (building.id === importedFloor.buildingId) {
        const existingIndex = building.floors.findIndex(f => f.id === importedFloor.id);
        if (existingIndex !== -1) {
          building.floors[existingIndex] = importedFloor;
        } else {
          building.floors.push(importedFloor);
        }
        building.updatedAt = new Date().toISOString();
        this.saveToLocalStorage();
        return;
      }
    }
  }

  getBuildingStats(buildingId: string) {
    const building = this.getBuilding(buildingId);
    if (!building) return null;
    return storageService.getBuildingStats(building);
  }

  resetToDefault(): void {
    this.buildingSystem = this.generateDefaultSystem();
    storageService.clearLocalStorage();
  }
}

export const buildingSystemService = new BuildingSystemService();
