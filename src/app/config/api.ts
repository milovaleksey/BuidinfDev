// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',
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
  },
  FLOORS: {
    LIST: (buildingId: string) => `/buildings/${buildingId}/floors`,
    GET: (id: string) => `/floors/${id}`,
    CREATE: '/floors',
    UPDATE: (id: string) => `/floors/${id}`,
    DELETE: (id: string) => `/floors/${id}`,
  },
  ROOMS: {
    LIST: (floorId: string) => `/floors/${floorId}/rooms`,
    GET: (id: string) => `/rooms/${id}`,
    CREATE: '/rooms',
    UPDATE: (id: string) => `/rooms/${id}`,
    DELETE: (id: string) => `/rooms/${id}`,
  },
  DEVICES: {
    LIST: '/devices',
    GET: (id: string) => `/devices/${id}`,
    COMMAND: (id: string) => `/devices/${id}/command`,
    BY_BUILDING: (buildingId: string) => `/devices/building/${buildingId}`,
  },
};
