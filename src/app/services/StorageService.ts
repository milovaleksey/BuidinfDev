import { Floor, Building, BuildingSystem, Device, DeviceType } from '../types';

interface StorageData {
  version: string;
  exportDate: string;
  buildingSystem: BuildingSystem; // Изменено: теперь система зданий
}

class StorageService {
  private STORAGE_KEY = 'building_management_data';
  private VERSION = '2.0.0'; // Увеличена версия для поддержки множественных зданий

  /**
   * Миграция старых типов устройств на новые
   */
  private migrateDeviceTypes(building: Building): Building {
    const typeMapping: Record<string, DeviceType> = {
      'door_lock': 'door',
      'light_switch': 'light_fixture',
      'hvac_unit': 'wall_ac',
      'motion_sensor': 'temperature_sensor', // удален, заменяем на температурный
      'thermostat': 'temperature_sensor'
    };

    building.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        room.devices = room.devices.map(device => {
          // Если тип устройства старый, мигрируем
          if (typeMapping[device.type as string]) {
            const newType = typeMapping[device.type as string];
            console.log(`🔄 Миграция устройства ${device.id}: ${device.type} → ${newType}`);
            
            // Обновляем тип
            device.type = newType;
            
            // Мигрируем данные
            if (device.type === 'door' && device.data?.locked !== undefined) {
              device.data.isOpen = !device.data.locked;
              device.data.isOnControl = true;
              device.data.isClosed = device.data.locked;
              device.data.mode = 'control';
              delete device.data.locked;
            }
            
            if (device.type === 'wall_ac' && device.data?.temperature !== undefined) {
              device.data.isPowerOn = true;
              device.data.fanMode = 'auto';
              device.data.workMode = 'cool';
              device.data.targetTemperature = device.data.temperature;
            }
            
            // Обновляем systemType
            if (device.type === 'door') device.systemType = 'access_control';
            if (device.type === 'light_fixture') device.systemType = 'lighting';
            if (device.type === 'wall_ac') device.systemType = 'hvac';
            if (device.type === 'temperature_sensor') device.systemType = 'sensors';
          }
          
          return device;
        });
      });
    });

    return building;
  }

  /**
   * Экспортирует все данные здания в JSON файл
   */
  exportToJSON(building: Building): void {
    const data = {
      version: this.VERSION,
      exportDate: new Date().toISOString(),
      building
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `building-plan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Экспортирует всю систему зданий в JSON файл
   */
  exportSystemToJSON(buildingSystem: BuildingSystem): void {
    const data: StorageData = {
      version: this.VERSION,
      exportDate: new Date().toISOString(),
      buildingSystem
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `building-system-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Экспортирует конкретный этаж в JSON файл
   */
  exportFloorToJSON(floor: Floor): void {
    const data = {
      version: this.VERSION,
      exportDate: new Date().toISOString(),
      floor
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `floor-${floor.number}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Импортирует данные здания из JSON файла
   */
  async importFromJSON(file: File): Promise<Building> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data: StorageData = JSON.parse(content);
          
          if (!data.version || !data.building) {
            throw new Error('Неверный формат файла');
          }
          
          resolve(this.migrateDeviceTypes(data.building));
        } catch (error) {
          reject(new Error('Ошибка чтения файла: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  }

  /**
   * Импортирует этаж из JSON файла
   */
  async importFloorFromJSON(file: File): Promise<Floor> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          if (!data.version || !data.floor) {
            throw new Error('Неверный формат файла');
          }
          
          resolve(data.floor);
        } catch (error) {
          reject(new Error('Ошибка чтения файла: ' + (error as Error).message));
        }
      };
      
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    });
  }

  /**
   * Сохраняет данные в localStorage
   */
  saveToLocalStorage(building: Building): void {
    const data: StorageData = {
      version: this.VERSION,
      exportDate: new Date().toISOString(),
      building
    };
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка сохранения в localStorage:', error);
      throw new Error('Не удалось сохранить данные');
    }
  }

  /**
   * Сохраняет систему зданий в localStorage
   */
  saveSystemToLocalStorage(buildingSystem: BuildingSystem): void {
    const data: StorageData = {
      version: this.VERSION,
      exportDate: new Date().toISOString(),
      buildingSystem
    };
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Ошибка сохранения в localStorage:', error);
      throw new Error('Не удалось сохранить данные');
    }
  }

  /**
   * Загружает данные из localStorage
   */
  loadFromLocalStorage(): Building | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const data: StorageData = JSON.parse(stored);
      // Применяем миграцию старых типов
      return this.migrateDeviceTypes(data.building);
    } catch (error) {
      console.error('Ошибка загрузки из localStorage:', error);
      return null;
    }
  }

  /**
   * Загружает систему зданий из localStorage с миграцией из старого формата
   */
  loadSystemFromLocalStorage(): BuildingSystem | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const data: StorageData = JSON.parse(stored);
      
      // Миграция из старого формата (одно здание) в новый формат (система зданий)
      if (data.building && !data.buildingSystem) {
        console.log('🔄 Миграция из старого формата в новый');
        const migratedBuilding = this.migrateDeviceTypes(data.building);
        return {
          buildings: [migratedBuilding],
          currentBuildingId: migratedBuilding.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      // Новый формат - система зданий
      if (data.buildingSystem) {
        // Применяем миграцию для каждого здания
        data.buildingSystem.buildings = data.buildingSystem.buildings.map(building => 
          this.migrateDeviceTypes(building)
        );
        return data.buildingSystem;
      }
      
      return null;
    } catch (error) {
      console.error('Ошибка загрузки из localStorage:', error);
      return null;
    }
  }

  /**
   * Очищает данные из localStorage
   */
  clearLocalStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Создает резервную копию в формате JSON
   */
  createBackup(building: Building): string {
    const data: StorageData = {
      version: this.VERSION,
      exportDate: new Date().toISOString(),
      building
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Восстанавливает из резервной копии
   */
  restoreFromBackup(jsonString: string): Building {
    try {
      const data: StorageData = JSON.parse(jsonString);
      
      if (!data.version || !data.building) {
        throw new Error('Неверный формат резервной копии');
      }
      
      return data.building;
    } catch (error) {
      throw new Error('Ошибка восстановления: ' + (error as Error).message);
    }
  }

  /**
   * По��учает статистику по зданию для отчетов
   */
  getBuildingStats(building: Building) {
    const totalFloors = building.floors.length;
    const totalRooms = building.floors.reduce((sum, floor) => sum + floor.rooms.length, 0);
    const totalDevices = building.floors.reduce((sum, floor) => {
      return sum + floor.rooms.reduce((roomSum, room) => roomSum + room.devices.length, 0);
    }, 0);
    
    const devicesByType = building.floors.reduce((acc, floor) => {
      floor.rooms.forEach(room => {
        room.devices.forEach(device => {
          acc[device.type] = (acc[device.type] || 0) + 1;
        });
      });
      return acc;
    }, {} as Record<string, number>);
    
    const devicesBySystem = building.floors.reduce((acc, floor) => {
      floor.rooms.forEach(room => {
        room.devices.forEach(device => {
          acc[device.systemType] = (acc[device.systemType] || 0) + 1;
        });
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFloors,
      totalRooms,
      totalDevices,
      devicesByType,
      devicesBySystem,
      lastExport: new Date().toISOString()
    };
  }
}

export const storageService = new StorageService();