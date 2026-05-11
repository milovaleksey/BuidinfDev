import { Building, Floor, Room, Device, BuildingSystem } from '../types';
import { backendApiService } from './BackendApiService';
import { storageService } from './StorageService';

/**
 * IntegratedBuildingService - единая точка доступа к данным зданий
 * 
 * Архитектура:
 * 1. Данные загружаются из бэкенда при старте
 * 2. Кэшируются локально для быстрого доступа
 * 3. При изменениях - синхронизация с бэкендом
 * 4. Fallback на localStorage при отсутствии подключения к бэкенду
 */
class IntegratedBuildingService {
  private buildingSystem: BuildingSystem | null = null;
  private isLoadedFromBackend: boolean = false;
  private isLoadedFromStorage: boolean = false;
  private isLoading: boolean = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    // Не загружаем данные в конструкторе, чтобы не блокировать UI
    // Вызывайте init() явно или используйте lazy loading через ensureLoaded()
  }

  /**
   * Инициализация сервиса - загрузка данных из бэкенда
   */
  async init(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadData();
    return this.loadPromise;
  }

  /**
   * Загрузка данных из бэкенда или localStorage
   */
  private async _loadData(): Promise<void> {
    if (this.isLoading || this.buildingSystem) {
      return;
    }

    this.isLoading = true;

    try {
      // Пытаемся загрузить из бэкенда
      console.log('🔄 Загрузка данных из бэкенда...');
      const buildings = await backendApiService.getAllBuildings();

      if (buildings.length > 0) {
        // Для каждого здания загружаем этажи
        const buildingsWithFloors = await Promise.all(
          buildings.map(async (building) => {
            const floors = await this._loadFloorsForBuilding(building.id);
            return { ...building, floors };
          })
        );

        this.buildingSystem = {
          buildings: buildingsWithFloors,
          currentBuildingId: buildingsWithFloors[0]?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.isLoadedFromBackend = true;
        this.isLoadedFromStorage = false;
        console.log('✅ Данные загружены из бэкенда:', buildingsWithFloors.length, 'зданий');

        // Сохраняем в localStorage для оффлайн доступа
        storageService.saveSystemToLocalStorage(this.buildingSystem);
      } else {
        // Если зданий нет, используем localStorage или создаем default
        await this._loadFromStorageOrDefault();
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки из бэкенда:', error);
      // Fallback на localStorage
      await this._loadFromStorageOrDefault();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Загрузка всех этажей для здания с помещениями и устройствами
   */
  private async _loadFloorsForBuilding(buildingId: string): Promise<Floor[]> {
    try {
      const floors = await backendApiService.getFloorsByBuilding(buildingId);

      // Для каждого этажа загружаем помещения
      const floorsWithRooms = await Promise.all(
        floors.map(async (floor) => {
          const rooms = await this._loadRoomsForFloor(floor.id);
          return {
            ...floor,
            buildingId,
            rooms,
          };
        })
      );

      return floorsWithRooms;
    } catch (error) {
      console.error(`Ошибка загрузки этажей для здания ${buildingId}:`, error);
      return [];
    }
  }

  /**
   * Загрузка всех помещений для этажа с устройствами
   */
  private async _loadRoomsForFloor(floorId: string): Promise<Room[]> {
    try {
      const rooms = await backendApiService.getRoomsByFloor(floorId);

      // Для каждого помещения загружаем устройства
      const roomsWithDevices = await Promise.all(
        rooms.map(async (room) => {
          const devices = await backendApiService.getDevicesByRoom(room.id);
          return {
            ...room,
            floorId,
            devices: devices || [],
          };
        })
      );

      return roomsWithDevices;
    } catch (error) {
      console.error(`Ошибка загрузки помещений для этажа ${floorId}:`, error);
      return [];
    }
  }

  /**
   * Загрузка из localStorage или создание дефолтной системы
   */
  private async _loadFromStorageOrDefault(): Promise<void> {
    const savedSystem = storageService.loadSystemFromLocalStorage();
    if (savedSystem) {
      this.buildingSystem = savedSystem;
      this.isLoadedFromStorage = true;
      this.isLoadedFromBackend = false;
      console.log('✅ Система зданий загружена из localStorage');
    } else {
      // Создаем дефолтную систему
      this.buildingSystem = this.generateDefaultSystem();
      this.isLoadedFromStorage = false;
      this.isLoadedFromBackend = false;
      console.log('📦 Создана новая система зданий');
    }
  }

  /**
   * Генерация дефолтной системы (для первого запуска)
   */
  private generateDefaultSystem(): BuildingSystem {
    const building: Building = {
      id: 'temp_building_1',
      name: 'Новое здание',
      address: '',
      floors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      buildings: [building],
      currentBuildingId: building.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Гарантирует, что данные загружены
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.buildingSystem && !this.isLoading) {
      await this.init();
    } else if (this.isLoading && this.loadPromise) {
      await this.loadPromise;
    }
  }

  /**
   * Проверка, откуда загружены данные
   */
  isFromBackend(): boolean {
    return this.isLoadedFromBackend;
  }

  isFromStorage(): boolean {
    return this.isLoadedFromStorage;
  }

  getLastUpdated(): string | undefined {
    return this.buildingSystem?.updatedAt;
  }

  /**
   * Получение всех зданий
   */
  getAllBuildings(): Building[] {
    return this.buildingSystem?.buildings || [];
  }

  /**
   * Получение текущего здания
   */
  getCurrentBuilding(): Building | null {
    const currentId = this.buildingSystem?.currentBuildingId;
    if (!currentId) return null;
    return this.getBuilding(currentId);
  }

  /**
   * Получение ID текущего здания
   */
  getCurrentBuildingId(): string | undefined {
    return this.buildingSystem?.currentBuildingId;
  }

  /**
   * Установка текущего здания
   */
  setCurrentBuilding(buildingId: string): void {
    if (this.buildingSystem) {
      this.buildingSystem.currentBuildingId = buildingId;
      this.buildingSystem.updatedAt = new Date().toISOString();
      this.saveToLocalStorage();
    }
  }

  /**
   * Получение здания по ID
   */
  getBuilding(buildingId: string): Building | null {
    return this.buildingSystem?.buildings.find((b) => b.id === buildingId) || null;
  }

  /**
   * Получение этажа по ID
   */
  getFloor(floorId: string): Floor | undefined {
    console.log('🔍 getFloor ищет этаж:', floorId);
    console.log('📚 Доступные здания:', this.buildingSystem?.buildings.length);
    
    for (const building of this.buildingSystem?.buildings || []) {
      console.log(`  🏢 Здание ${building.id} "${building.name}" имеет ${building.floors.length} этажей:`, 
        building.floors.map(f => ({ id: f.id, name: f.name })));
      
      const floor = building.floors.find((f) => f.id === floorId || String(f.id) === String(floorId));
      if (floor) {
        console.log('✅ Найден этаж:', floor.id, floor.name);
        return floor;
      }
    }
    
    console.warn('❌ Этаж не найден:', floorId);
    return undefined;
  }

  /**
   * Получение помещения по ID
   */
  getRoom(roomId: string): Room | undefined {
    for (const building of this.buildingSystem?.buildings || []) {
      for (const floor of building.floors) {
        const room = floor.rooms.find((r) => r.id === roomId);
        if (room) return room;
      }
    }
    return undefined;
  }

  /**
   * Создание нового здания
   */
  async createBuilding(name: string, address?: string): Promise<Building> {
    try {
      // Создаем в бэкенде
      const newBuilding = await backendApiService.createBuilding({ name, address });

      if (newBuilding) {
        // Добавляем в локальный кэш
        if (this.buildingSystem) {
          this.buildingSystem.buildings.push({
            ...newBuilding,
            floors: [],
          });
          this.buildingSystem.updatedAt = new Date().toISOString();
          this.saveToLocalStorage();
        }

        return { ...newBuilding, floors: [] };
      }

      throw new Error('Failed to create building');
    } catch (error) {
      console.error('Ошибка создания здания:', error);
      throw error;
    }
  }

  /**
   * Создание нового этажа
   */
  async addFloor(buildingId: string, name: string, number: number): Promise<Floor> {
    try {
      // Создаем в бэкенде
      const newFloor = await backendApiService.createFloor(buildingId, { name, number });

      if (newFloor) {
        // Добавляем в локальный кэш
        const building = this.getBuilding(buildingId);
        if (building) {
          building.floors.push({
            ...newFloor,
            buildingId,
            rooms: [],
          });
          building.floors.sort((a, b) => a.number - b.number);
          if (this.buildingSystem) {
            this.buildingSystem.updatedAt = new Date().toISOString();
          }
          this.saveToLocalStorage();
        }

        return { ...newFloor, buildingId, rooms: [] };
      }

      throw new Error('Failed to create floor');
    } catch (error) {
      console.error('Ошибка создания этажа:', error);
      throw error;
    }
  }

  /**
   * Удаление здания
   */
  async deleteBuilding(buildingId: string): Promise<void> {
    try {
      // Удаляем в бэкенде
      await backendApiService.deleteBuilding(buildingId);

      // Удаляем из локального кэша
      if (this.buildingSystem) {
        this.buildingSystem.buildings = this.buildingSystem.buildings.filter(
          (b) => b.id !== buildingId
        );

        // Если удалили текущее здание, выбираем первое доступное
        if (this.buildingSystem.currentBuildingId === buildingId) {
          this.buildingSystem.currentBuildingId = this.buildingSystem.buildings[0]?.id;
        }

        this.buildingSystem.updatedAt = new Date().toISOString();
        this.saveToLocalStorage();
      }
    } catch (error) {
      console.error('Ошибка удаления здания:', error);
      throw error;
    }
  }

  /**
   * Удаление этажа
   */
  async deleteFloor(floorId: string): Promise<void> {
    try {
      // Удаляем в бэкенде
      await backendApiService.deleteFloor(floorId);

      // Удаляем из локального кэша
      for (const building of this.buildingSystem?.buildings || []) {
        const floorIndex = building.floors.findIndex((f) => f.id === floorId);
        if (floorIndex !== -1) {
          building.floors.splice(floorIndex, 1);
          if (this.buildingSystem) {
            this.buildingSystem.updatedAt = new Date().toISOString();
          }
          this.saveToLocalStorage();
          break;
        }
      }
    } catch (error) {
      console.error('Ошибка удаления этажа:', error);
      throw error;
    }
  }

  /**
   * Обновление помещения
   */
  updateRoom(roomId: string, updates: Partial<Room>): void {
    const room = this.getRoom(roomId);
    if (room) {
      Object.assign(room, updates);
      if (this.buildingSystem) {
        this.buildingSystem.updatedAt = new Date().toISOString();
      }
      this.saveToLocalStorage();

      // TODO: Синхронизировать с бэкендом
      backendApiService.updateRoom(roomId, updates).catch((err) => {
        console.error('Ошибка синхронизации помещения с бэкендом:', err);
      });
    }
  }

  /**
   * Обновление устройства
   */
  updateDevice(deviceId: string, updates: Partial<Device>): void {
    for (const building of this.buildingSystem?.buildings || []) {
      for (const floor of building.floors) {
        for (const room of floor.rooms) {
          const device = room.devices.find((d) => d.id === deviceId);
          if (device) {
            Object.assign(device, updates);
            if (this.buildingSystem) {
              this.buildingSystem.updatedAt = new Date().toISOString();
            }
            this.saveToLocalStorage();

            // TODO: Синхронизировать с бэкендом
            backendApiService.updateDevice(deviceId, updates).catch((err) => {
              console.error('Ошибка синхронизации устройства с бэкендом:', err);
            });
            return;
          }
        }
      }
    }
  }

  /**
   * Добавление устройства
   */
  addDevice(roomId: string, device: Device): void {
    const room = this.getRoom(roomId);
    if (room) {
      room.devices.push(device);
      if (this.buildingSystem) {
        this.buildingSystem.updatedAt = new Date().toISOString();
      }
      this.saveToLocalStorage();

      // TODO: Синхронизировать с бэкендом
      backendApiService.createDevice(roomId, device).catch((err) => {
        console.error('Ошибка синхронизации устройства с бэкендом:', err);
      });
    }
  }

  /**
   * Удаление устройства
   */
  removeDevice(deviceId: string): void {
    for (const building of this.buildingSystem?.buildings || []) {
      for (const floor of building.floors) {
        for (const room of floor.rooms) {
          const deviceIndex = room.devices.findIndex((d) => d.id === deviceId);
          if (deviceIndex !== -1) {
            room.devices.splice(deviceIndex, 1);
            if (this.buildingSystem) {
              this.buildingSystem.updatedAt = new Date().toISOString();
            }
            this.saveToLocalStorage();

            // TODO: Синхронизировать с бэкендом
            backendApiService.deleteDevice(deviceId).catch((err) => {
              console.error('Ошибка синхронизации устройства с бэкендом:', err);
            });
            return;
          }
        }
      }
    }
  }

  /**
   * Сохранение в localStorage
   */
  saveToLocalStorage(): void {
    if (this.buildingSystem) {
      storageService.saveSystemToLocalStorage(this.buildingSystem);
    }
  }

  /**
   * Экспорт здания в JSON
   */
  async exportBuildingToJSON(buildingId: string): Promise<void> {
    try {
      const buildingData = await backendApiService.exportBuilding(buildingId);
      const json = JSON.stringify(buildingData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `building_${buildingId}_${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка экспорта здания:', error);
      throw error;
    }
  }

  /**
   * Экспорт всей системы в JSON
   */
  exportSystemToJSON(): void {
    if (this.buildingSystem) {
      const json = JSON.stringify(this.buildingSystem, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `building_system_${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Импорт здания из JSON
   */
  async importBuildingFromJSON(file: File): Promise<void> {
    try {
      const text = await file.text();
      const buildingData = JSON.parse(text);

      // Импортируем в бэкенд
      const imported = await backendApiService.importBuilding(buildingData);

      if (imported) {
        // Перезагружаем данные из бэкенда
        await this.reload();
      }
    } catch (error) {
      console.error('Ошибка импорта здания:', error);
      throw error;
    }
  }

  /**
   * Сброс к дефолтным данным
   */
  resetToDefault(): void {
    this.buildingSystem = this.generateDefaultSystem();
    this.isLoadedFromBackend = false;
    this.isLoadedFromStorage = false;
    this.saveToLocalStorage();
  }

  /**
   * Перезагрузка данных из бэкенда
   */
  async reload(): Promise<void> {
    this.buildingSystem = null;
    this.isLoadedFromBackend = false;
    this.isLoadedFromStorage = false;
    this.isLoading = false;
    this.loadPromise = null;
    await this.init();
  }

  /**
   * Получение статистики по зданию
   */
  getBuildingStats(buildingId: string) {
    const building = this.getBuilding(buildingId);
    if (!building) return null;

    const totalFloors = building.floors.length;
    const totalRooms = building.floors.reduce((sum, f) => sum + f.rooms.length, 0);
    const totalDevices = building.floors.reduce(
      (sum, f) => sum + f.rooms.reduce((s, r) => s + r.devices.length, 0),
      0
    );

    return {
      totalFloors,
      totalRooms,
      totalDevices,
    };
  }
}

export const integratedBuildingService = new IntegratedBuildingService();