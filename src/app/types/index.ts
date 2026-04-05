export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

export type SystemType = 'access_control' | 'video' | 'heating' | 'lighting' | 'hvac' | 'sensors';

export type RoomType = 'room' | 'corridor' | 'office' | 'meeting' | 'storage' | 'bathroom' | 'kitchen' | 'lobby' | 'technical';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: UserPermissions;
  createdAt?: string;
  lastLogin?: string;
}

export interface UserPermissions {
  rooms: string[]; // room IDs user has access to
  systems: SystemType[]; // systems user can manage
  canEdit: boolean; // Может ли редактировать планы
  canExport: boolean; // Может ли экспортировать данные
  canManageUsers: boolean; // Может ли управлять пользователями
}

export interface Room {
  id: string;
  number: string;
  name: string;
  floorId: string;
  type?: RoomType; // Тип помещения
  area: number;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  devices: Device[];
  mqttTopic?: string;
  // Polygon mode - if defined, room is a polygon instead of rectangle
  polygon?: { x: number; y: number }[]; // Points relative to position
  metadata?: RoomMetadata; // Дополнительные данные
  locked?: boolean; // Блокировка от перемещения и изменения размера
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: 'online' | 'offline' | 'warning';
  roomId: string;
  position: { x: number; y: number }; // Позиция внутри помещения (относительная)
  rotation?: number; // Угол поворота в градусах (0-360)
  scale?: number; // Коэффициент масштаба (0.5 - 2.0, по умолчанию 1)
  data?: DeviceData; // Опциональные данные устройства
  systemType?: SystemType; // Опциональный тип системы
  mqttTopic?: string; // Полный MQTT топик устройства
}

export type DeviceType = 
  // Освещение
  | 'light_fixture'      // Светильник
  | 'street_light'       // Уличный светильник
  // СКУД
  | 'door'               // Дверь
  | 'turnstile'          // Турникет
  | 'tripod_turnstile'   // Тумбовый турникет
  | 'barrier'            // Шлагбаум
  | 'gate'               // Ворота
  // Видеонаблюдение
  | 'camera'             // Видеокамера
  | 'projector'          // Проектор
  | 'tv'                 // Телевизор
  // HVAC (Кондиционирование)
  | 'wall_ac'            // Настенный кондиционер
  | 'cassette_ac'        // Кассетный кондиционер
  // Отопление
  | 'radiator'           // Батарея отопления
  | 'air_curtain'        // Тепловая завеса
  // Датчики
  | 'temperature_sensor' // Датчик температуры
  | 'co2_sensor';        // Датчик CO2

export interface DeviceData {
  // Общие
  temperature?: number;
  co2?: number;
  humidity?: number;
  
  // Освещение
  lightLevel?: number;          // Яркость 0-100
  lightGroup?: string;          // Группа освещения
  lightStatus?: 'ok' | 'error'; // Статус исправности
  
  // СКУД (Дверь, турникет, шлагбаум, ворота)
  isOpen?: boolean;             // Открыт
  isOnControl?: boolean;        // На контроле
  isClosed?: boolean;           // Закрыт
  mode?: 'office' | 'control' | 'open' | 'closed'; // Режим работы
  
  // Видеонаблюдение
  streamUrl?: string;           // URL потока видео
  recording?: boolean;          // Запись включена
  
  // Проектор и ТВ
  isPowerOn?: boolean;          // Включен/выключен
  brightness?: number;          // Яркость (проектор) 0-100
  volume?: number;              // Громкость (ТВ/проектор) 0-100
  input?: string;               // Источник входного сигнала (HDMI1, HDMI2, VGA, USB и т.д.)
  muted?: boolean;              // Звук выключен
  
  // HVAC (Кондиционеры)
  fanMode?: 'auto' | 'low' | 'medium' | 'high'; // Режим вентилятора
  workMode?: 'cool' | 'heat' | 'fan' | 'dry' | 'auto'; // Режим работы
  targetTemperature?: number;   // Уставка температуры
  error?: string;               // Код ошибки
  
  // Отопление
  thermostatSetting?: number;   // Уставка термоголовки (батареи)
  curtainPowerOn?: boolean;     // Вкл/выкл (тепловая завеса)
  curtainTemperature?: number;  // Уставка температуры (тепловая завеса)
  
  // Датчики (только чтение)
  motion?: boolean;
  locked?: boolean;
}

export interface Floor {
  id: string;
  number: number;
  name: string;
  buildingId: string; // ID здания, �� которому относится этаж
  rooms: Room[];
  backgroundImage?: string; // URL или base64 изображения подложки
  backgroundOpacity?: number; // Прозрачность подложки 0-1
  metadata?: FloorMetadata; // Дополнительные данные этажа
}

export interface Building {
  id: string;
  name: string;
  address?: string; // Адрес здания
  floors: Floor[];
  metadata?: BuildingMetadata; // Дополнительные данные здания
  createdAt?: string;
  updatedAt?: string;
}

// Локация - может быть зданием или этажом
export type LocationType = 'building' | 'floor';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  parentId?: string; // ID родительской локации (для этажей - ID здания)
  // Для зданий
  address?: string;
  metadata?: BuildingMetadata;
  // Для этажей
  number?: number; // Номер этажа
  buildingId?: string; // ID здания
  rooms?: Room[];
  backgroundImage?: string;
  backgroundOpacity?: number;
  floorMetadata?: FloorMetadata;
  createdAt?: string;
  updatedAt?: string;
}

export interface MQTTMessage {
  topic: string;
  payload: any;
  timestamp: number;
}

export interface RoomMetadata {
  description?: string; // Описание помещения
  capacity?: number; // Вместимость помещения
  usage?: string; // Назначение помещения
  owner?: string; // Ответственный за помещение
  tags?: string[]; // Теги для поиска и фильтрации
}

export interface FloorMetadata {
  height?: number; // Высота этажа в метрах
  area?: number; // Общая площадь этажа
  accessLevel?: 'public' | 'restricted' | 'private'; // Уровень доступа
  emergencyExits?: number; // Количество аварийных выходов
  notes?: string; // Примечания
}

export interface BuildingMetadata {
  totalArea?: number; // Общая площадь здания
  constructionYear?: number; // Год постройки
  floors?: number; // Количество этажей
  underground?: number; // Количество подземных уровней
  owner?: string; // Владелец здания
  manager?: string; // Управляющая компания
  notes?: string; // Примечания
}

// Система управления зданиями
export interface BuildingSystem {
  buildings: Building[];
  currentBuildingId?: string; // ID текущего выбранного здания
  createdAt?: string;
  updatedAt?: string;
}

// Экспорт для базы данных (Supabase)
export interface DatabaseSchema {
  buildings: Building[];
  users: User[];
  logs?: SystemLog[]; // История изменений
}

export interface SystemLog {
  id: string;
  timestamp: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'export' | 'import';
  entity: 'building' | 'floor' | 'room' | 'device' | 'user';
  entityId: string;
  details?: string;
}