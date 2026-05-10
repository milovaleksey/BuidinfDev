// API Configuration
// Автоматическое определение URL бэкенда
const getBaseUrl = () => {
  // Если есть переменная окружения - используем её
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // В продакшене используем текущий хост
  if (import.meta.env.PROD) {
    return `${window.location.protocol}//${window.location.hostname}:8080/api`;
  }
  
  // В разработке используем localhost
  return 'http://localhost:8080/api';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000,
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    HEALTH: '/auth/health',
  },
  BUILDINGS: {
    LIST: '/buildings',
    GET: (id: string) => `/buildings/${id}`,
    CREATE: '/buildings',
    UPDATE: (id: string) => `/buildings/${id}`,
    DELETE: (id: string) => `/buildings/${id}`,
    EXPORT: (id: string) => `/buildings/${id}/export`,
    IMPORT: '/buildings/import',
  },
  FLOORS: {
    LIST: (buildingId: string) => `/floors/building/${buildingId}`,
    GET: (id: string) => `/floors/${id}`,
    CREATE: (buildingId: string) => `/floors/building/${buildingId}`,
    UPDATE: (id: string) => `/floors/${id}`,
    DELETE: (id: string) => `/floors/${id}`,
  },
  ROOMS: {
    LIST: (floorId: string) => `/rooms/floor/${floorId}`,
    GET: (id: string) => `/rooms/${id}`,
    CREATE: (floorId: string) => `/rooms/floor/${floorId}`,
    UPDATE: (id: string) => `/rooms/${id}`,
    DELETE: (id: string) => `/rooms/${id}`,
  },
  DEVICES: {
    LIST: (roomId: string) => `/devices/room/${roomId}`,
    GET: (id: string) => `/devices/${id}`,
    CREATE: (roomId: string) => `/devices/room/${roomId}`,
    UPDATE: (id: string) => `/devices/${id}`,
    UPDATE_STATE: (id: string) => `/devices/${id}/state`,
    DELETE: (id: string) => `/devices/${id}`,
    BY_BUILDING: (buildingId: string) => `/devices/building/${buildingId}`,
  },
  NODE_RED: {
    // Управление устройствами через Node-RED
    CONTROL: (deviceId: string) => `/proxy/control/${deviceId}`,
    STATE: (deviceId: string) => `/proxy/state/${deviceId}`,
    // Отчеты
    REPORT_BUILDING: (buildingId: string) => `/proxy/reports/building/${buildingId}`,
    REPORT_SYSTEM: (systemType: string) => `/proxy/reports/system/${systemType}`,
    // Произвольные запросы к Node-RED
    PROXY: '/proxy',
  },
  AUDIT: {
    LIST: '/audit/logs',
    GET: (id: string) => `/audit/logs/${id}`,
  },
};